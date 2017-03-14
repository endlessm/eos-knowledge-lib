const Lang = imports.lang;
const System = imports.system;

const EosShard = imports.gi.EosShard;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Xapian = imports.gi.Xapian;

// For those interested in basin's etymology, it goes roughly like this:
// PDF -> Acrobat -> Charles Blondin -> Niagara Gorge -> Whirlpool Basin

const Shard = new Lang.Class({
    Name: 'Shard',

    _init: function (path) {
        this._file = Gio.File.new_for_path(path);
        this._stream = this._file.replace_readwrite(null,
                                                    false,
                                                    Gio.FileCreateFlags.NONE,
                                                    null);
        this._out_stream = this._stream.get_output_stream();
        this._writer = new EosShard.WriterV2({ fd: this._out_stream.get_fd()});
    },

    add: function (ekn_hash, content_type, metadata_file, blob_file) {
        let record_id = this._writer.add_record(ekn_hash);

        if (metadata_file) {
            let blob_id = this._writer.add_blob(EosShard.V2_BLOB_METADATA,
                                                metadata_file,
                                                'application/json',
                                                EosShard.BlobFlags.COMPRESSED_ZLIB);
            this._writer.add_blob_to_record(record_id, blob_id);
        }

        if (blob_file) {
            let blob_id = this._writer.add_blob(EosShard.V2_BLOB_DATA,
                                                blob_file,
                                                content_type,
                                                EosShard.BlobFlags.NONE);
            this._writer.add_blob_to_record(record_id, blob_id);
        }
    },

    finish: function (self) {
        this._writer.finish();
    }
});

const Links = new Lang.Class({
    Name: 'Links',

    _init: function () {
        this._links = {};
    },

    add: function (link, ekn_id) {
        this._links[link] = ekn_id;
    },

    finish: function () {
        let [file, stream] = Gio.File.new_tmp('links_XXXXXX');
        let out_stream = stream.get_output_stream();

        let dict = EosShard.DictionaryWriter.new_for_stream(out_stream, 0);
        dict.begin();
        Object.keys(this._links).sort().forEach((link) => {
            dict.add_entry(link, this._links[link]);
        });
        dict.finish();

        return file;
    }
});

const SEQUENCE_NUMBER_VALUE_NO = 0;
const EXACT_TITLE_PREFIX = 'XEXACTS';
const TITLE_PREFIX = 'S';
const TAG_PREFIX = 'K';
const ID_PREFIX = 'Q';

const DEFAULT_WEIGHT = 1;
const EXACT_WEIGHT = 27;

const Index = new Lang.Class({
    Name: 'Index',

    _init: function () {
        let db_dir = GLib.dir_make_tmp('db_dir_XXXXXX');
        let stopwords = [];
        let prefixes = {
            'prefixes': [
                {
                    'field':  'exact_title',
                    'prefix': EXACT_TITLE_PREFIX
                },
                {
                    'field':  'title',
                    'prefix': TITLE_PREFIX
                }
            ],
            'booleanPrefixes': [
                {
                    'field': 'tag',
                    'prefix': TAG_PREFIX
                },
                {
                    'field': 'id',
                    'prefix': ID_PREFIX
                }
            ]
        };

        this._db = new Xapian.WritableDatabase({ path: db_dir,
                                                 action: Xapian.DatabaseAction.CREATE_OR_OVERWRITE,
                                                 flags: Xapian.DatabaseFlags.BACKEND_GLASS });
        this._db.init(null);
        this._db.set_metadata('XbPrefixes', JSON.stringify(prefixes));
        this._db.set_metadata('XbStopwords', JSON.stringify(stopwords));

        this._termgenerator = new Xapian.TermGenerator();
        this._termgenerator.set_database(this._db);
    },

    add: function (metadata) {
        let exact_title = metadata['title'].toLocaleLowerCase().replace('-', '_').replace(' ', '_');

        let doc = new Xapian.Document();
        doc.set_data(metadata['@id']);
        doc.add_boolean_term(ID_PREFIX + metadata['@id']);
        doc.add_term_full(EXACT_TITLE_PREFIX + exact_title, EXACT_WEIGHT);

        metadata['tags'].forEach((tag) => {
            doc.add_boolean_term(TAG_PREFIX + tag);
        });

        if (metadata['sequenceNumber'] >= 0) {
            doc.add_numeric_value(SEQUENCE_NUMBER_VALUE_NO, metadata['sequenceNumber']);
        }

        this._termgenerator.set_document(doc);
        this._termgenerator.index_text_full(metadata['title'], DEFAULT_WEIGHT, TITLE_PREFIX);
        this._termgenerator.index_text_full(metadata['title'], DEFAULT_WEIGHT, '');

        this._db.add_document(doc);
    },

    finish: function () {
        let [file, stream] = Gio.File.new_tmp('db_XXXXXX');
        let out_stream = stream.get_output_stream();

        this._db.commit();
        this._db.compact_to_fd(out_stream.get_fd(), Xapian.DatabaseCompactFlags.SINGLE_FILE);
        this._db.close();

        return file;
    }
});

const Packer = new Lang.Class ({
    Name: 'Packer',

    _init: function (json_path, shard_path) {
        let json_file = Gio.File.new_for_path(json_path);
        let [success, data, tag] = json_file.load_contents(null);
        this._json = JSON.parse(data);

        this._shard = new Shard(shard_path);
        this._index = new Index();
        this._links = new Links();
    },

    run: function () {
        print('[1/5] writing content');
        this._json['content'].forEach((entry) => {
            this._add_content(entry);
        });

        print('[2/5] writing thumbnails');
        this._json['thumbnails'].forEach((entry) => {
            this._add_thumbnail(entry);
        });

        print('[3/5] writing sets');
        this._json['sets'].forEach((entry) => {
            this._add_set(entry);
        });

        print('[4/5] writing links');
        let links_hash = this._hashify('link-table');
        let links_file = this._links.finish();
        this._shard.add(links_hash, 'application/x-endlessm-dictionary', null, links_file);

        print('[5/5] writing index');
        let index_hash = this._hashify('xapian-db');
        let index_file = this._index.finish();
        this._shard.add(index_hash, 'application/x-endlessm-xapian-db', null, index_file);

        this._shard.finish();
    },

    _hashify: function (string) {
        return GLib.compute_checksum_for_string(GLib.ChecksumType.SHA1, string, -1);
    },

    _dump_to_file: function (data) {
        let [file, stream] = Gio.File.new_tmp('data_XXXXXX');
        file.replace_contents(JSON.stringify(data), null, false, 0, null);
        return file;
    },

    _add_content: function (metadata) {
        let content_hash = this._hashify(metadata['sourceURI']);

        metadata['@id'] = 'ekn:///' + content_hash;
        metadata['@type'] = 'ekn://_vocab/ArticleObject';

        let metadata_file = this._dump_to_file(metadata);
        let content_file = Gio.File.new_for_uri(metadata['sourceURI']);

        this._shard.add(content_hash, metadata['contentType'], metadata_file, content_file);
        this._index.add(metadata);

        if (metadata['matchingLinks']) {
            metadata['matchingLinks'].forEach((link) => {
                this._links.add(link, metadata['@id']);
            });
        }
    },

    _add_thumbnail: function (metadata) {
        let thumbnail_hash = this._hashify(metadata['sourceURI']);

        metadata['@id'] = 'ekn:///' + thumbnail_hash;
        metadata['@type'] = 'ekn://_vocab/ImageObject';

        let metadata_file = this._dump_to_file(metadata);
        let thumbnail_file = Gio.File.new_for_uri(metadata['sourceURI']);

        this._shard.add(thumbnail_hash, metadata['contentType'], metadata_file, thumbnail_file);
    },

    _add_set: function (metadata) {
        let set_hash = this._hashify(metadata['title']);

        metadata['@type'] = 'ekn://_vocab/SetObject';
        metadata['@id'] = 'ekn:///' + set_hash;
        metadata['thumbnail'] = 'ekn:///' + this._hashify(metadata['thumbnailURI']);

        let metadata_file = this._dump_to_file(metadata);

        this._shard.add(set_hash, null, metadata_file, null);
        this._index.add(metadata);
    }
});

const USAGE = [
    'usage: basin <path_to_input_json> <path_to_output_shard>',
    '',
    'basin shard creation tool for Knowledge Apps.',
].join('\n');

function main () {
    let argv = ARGV.slice();

    if (argv.length !== 2)
        fail_with_message(USAGE);

    let json_path = argv[0];
    let shard_path = argv[1];

    let packer = new packer(json_path, shard_path);
    packer.run();

    print('Sucessfully created', shard_path);
}

function fail_with_message () {
    // join args with space, a la print/console.log
    var args = Array.prototype.slice.call(arguments);
    printerr(args.join(' '));
    System.exit(1);
}
