const Engine = imports.search.engine;
const EosShard = imports.gi.EosShard;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const QueryObject = imports.search.queryObject;
const System = imports.system;

const USAGE = [
    'usage: kermit grep <shard path> <pattern>',
    '       kermit list <shard path>',
    '       kermit dump <shard path> <ekn id> <data|metadata|another blob name>',
    '       kermit query <app_id> "<querystring>"',
    '       kermit stat <shard path>',
    '',
    'kermit is a shard inspection utility for Knowledge Apps.',
].join('\n');

// For those interested in kermit's etymology, it goes roughly like this:
// EosShard -> Dark Shard -> Dark Crystal -> Jim Hensen -> Kermit

// size of xapian-bridge result batches
const BATCH_SIZE = 10;

function main () {
    let argv = ARGV.slice();
    let action = argv.shift();

    if (action === 'grep' && argv.length === 2)
        grep(argv[0], argv[1]);
    else if (action === 'list' && argv.length === 1)
        grep(argv[0], '');
    else if (action === 'dump' && argv.length === 3)
        dump(argv[0], argv[1], argv[2]);
    else if (action === 'query' && argv.length === 2)
        query(argv[0], argv[1]);
    else if (action === 'stat' && argv.length === 1)
        stat(argv[0]);
    else
        fail_with_message(USAGE);
}

function grep (path, pattern) {
    let shard = get_shard_for_path(path);
    let records = shard.list_records();
    records.forEach(function (record, i) {
        let regex = new RegExp(pattern);
        let id = record.get_hex_name();
        let offset, content_type;

        if (record.data) {
            offset = record.data.get_offset();
            content_type = record.data.get_content_type();
        } else {
            offset = undefined;
            content_type = "Unknown - no data";
        }

        if (!record.metadata) {
            print_result(id, content_type, "Unknown - no metadata", offset);
            return;
        }

        let metadata_text = record.metadata.load_contents().get_data().toString();

        if (metadata_text.match(regex) !== null) {
            let metadata = JSON.parse(metadata_text);
            let title = metadata.title;
            print_result(id, content_type, title, offset);
        }

        // Unfortunately, Spidermonkey isn't able to effectively track the
        // memory footprint of native objects like GBytes very well, so we
        // have to nudge it in the right direction every now and then.
        if (i%1000 === 0)
            imports.system.gc();
    });
}

function fmt_size (size_bytes) {
    if (size_bytes < 1e3) {
        return size_bytes.toPrecision(4) + ' Bytes';
    } else if (size_bytes >= 1e3 && size_bytes < 1e6) {
        let size_kbytes = size_bytes / 1e3;
        return size_kbytes.toPrecision(4) + ' KB';
    } else {
        let size_mbytes = size_bytes / 1e6;
        return size_mbytes.toPrecision(4) + ' MB';
    }
}

function stat (path) {
    let shard = get_shard_for_path(path);
    let records = shard.list_records();

    /**
     * To calculate the sum of all spaces between blobs (i.e. wasted space),
     * we only keep track of the first and last offsets (along with the total
     * blob length), effectively squashing all blobs but the last one together.
     * In general, this shard
     *
     *   [ block 1 ]      // offset 1
     *   empty space 1
     *   [ block 2 ]      // offset 2
     *   empty space 2
     *   ...
     *   [ block N-1 ]    // offset N-1
     *   empty space N-1
     *   [ block N ]      // offset N
     *
     * would become
     *
     *   [ block 1 ]      // offset 1
     *   [ block 2 ]
     *   ...
     *   [ block N-1 ]
     *   empty space 1
     *   empty space 2
     *   ...
     *   empty space N-1
     *   [ block N ]      // offset N
     *
     * Then we just subtract the megablock's offset and length from the last
     * block's offset to get the total empty space.
     */
    let first_offset = Infinity, last_offset = 0;
    let length_sum = 0, last_length = 0;
    let content_type_sizes = {};
    function tallyBlob (blob) {
        let offset = blob.get_offset();
        let length = blob.get_packed_size();
        let content_type = blob.get_content_type();

        if (offset > last_offset) {
            last_offset = offset;
            last_length = length;
        }
        if (offset < first_offset) {
            first_offset = offset;
        }

        length_sum += length;

        if (!content_type_sizes.hasOwnProperty(content_type)) {
            content_type_sizes[content_type] = [];
        }
        content_type_sizes[content_type].push(length);
    }

    records.forEach(function (record, i) {
        let data = record.data;
        let metadata = record.metadata;

        if (data) {
            tallyBlob(data);
        }
        if (metadata) {
            tallyBlob(metadata);
        }

        // Unfortunately, Spidermonkey isn't able to effectively track the
        // memory footprint of native objects like GBytes very well, so we
        // have to nudge it in the right direction every now and then.
        if (i%1000 === 0)
            imports.system.gc();
    });

    let empty_bytes = last_offset - (first_offset + length_sum - last_length);
    print('Wasted space between blobs:', fmt_size(empty_bytes));

    for (let content_type in content_type_sizes) {
        let max_bytes = 0, avg_bytes = 0;
        for (let size_bytes of content_type_sizes[content_type]) {
            avg_bytes += size_bytes;
            if (size_bytes > max_bytes)
                max_bytes = size_bytes;
        }
        avg_bytes /= content_type_sizes[content_type].length;

        let str = 'Average size for ' + content_type + ': ' + fmt_size(avg_bytes);
        str += ' (max ' + fmt_size(max_bytes) + ')';
        print(str);
    }
}

function query (app_id, query_string) {
    let engine = new Engine.Engine();
    let query_obj = new QueryObject.QueryObject({
        query: query_string,
        limit: BATCH_SIZE,
        app_id: app_id,
    });
    perform_query(engine, query_obj);

    // run the mainloop so we don't exit before our callback fires
    imports.mainloop.run();
}

function perform_query (engine, query_obj) {
    engine.get_objects_by_query(query_obj, null, (engine, task) => {
        try {
            let [results, info] = engine.get_objects_by_query_finish(task);
            results.forEach(function (result) {
                let id = result.ekn_id.split('/').pop();
                print_result(id, result.content_type, result.title);
            });

            // if there were fewer than the requested number of results, that
            // means we're done.
            if (results.length < BATCH_SIZE) {
                System.exit(0);
            } else {
                perform_query(engine, info.more_results);
            }
        } catch (e) {
            fail_with_error(e);
        }
    });
}

function print_result (id, content_type, title, offset) {
    let output = [
        id,
        content_type,
        // use JSON.stringify to escape title and wrap in quotes
        JSON.stringify(title),
    ];
    if (typeof offset !== 'undefined')
        output.push('Offset ' + offset);
    print(output.join(' - '));
}

function dump (path, id, blob_name) {
    let shard = get_shard_for_path(path);
    let record = shard.find_record_by_hex_name(id);

    if (record === null) {
        let sha1 = GLib.compute_checksum_for_string(GLib.ChecksumType.SHA1, id, -1);
        record = shard.find_record_by_hex_name(sha1);
    }

    if (record === null) {
        fail_with_message('Could not find shard entry for id', id);
    }

    function find_blob() {
        if (blob_name === 'data')
            return record.data;
        else if (blob_name === 'metadata')
            return record.metadata;
        else
            return record.lookup_blob(blob_name);
    }

    let stdout = Gio.UnixOutputStream.new(1, false);
    let blob = find_blob();
    stdout.splice(blob.get_stream(), Gio.OutputStreamSpliceFlags.NONE, null);
}

function get_shard_for_path (path) {
    let shard;
    try {
        shard = new EosShard.ShardFile({
            path: path,
        });
        shard.init(null);
    } catch (e) {
        fail_with_error(e, 'Could not open shard at path', path);
    }
    return shard;
}

function fail_with_message () {
    // join args with space, a la print/console.log
    var args = Array.prototype.slice.call(arguments);
    printerr(args.join(' '));
    System.exit(1);
}

function fail_with_error (e) {
    var args = Array.prototype.slice.call(arguments, 1);
    logError(e, e + ' ' + args.join(' '));
    System.exit(1);
}
