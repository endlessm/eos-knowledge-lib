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
    '       kermit crosslink <shard path> <url>',
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
    else if (action === 'crosslink' && argv.length === 2)
        crosslink(argv[0], argv[1]);
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

// This hash is derived from sha1('link-table'), and for now is the hardcoded
// location of link tables for all shards.
const LINK_TABLE_ID = '4dba9091495e8f277893e0d400e9e092f9f6f551';
function crosslink (path, url) {
    let shard = get_shard_for_path(path);
    let table_record = shard.find_record_by_hex_name(LINK_TABLE_ID);
    let dictionary;
    if (table_record) {
        dictionary = table_record.data.load_as_dictionary();
    } else {
        fail_with_message('No dictionary record found in this shard!');
    }

    let ekn_id = dictionary.lookup_key(url);
    if (ekn_id) {
        let hash = ekn_id.split('/').pop();
        print(hash);
    } else {
        print('No record found for url "' + url + '"');
    }
}

function stat (path) {
    let shard_file = Gio.File.new_for_path(path);
    let shard_info = shard_file.query_info('standard::size', Gio.FileQueryInfoFlags.NONE, null);
    let total_shard_bytes = shard_info.get_size();

    let shard = get_shard_for_path(path);
    let records = shard.list_records();

    let n_blobs = 0;

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
    let total_blob_bytes = 0, last_blob_bytes = 0;
    let content_type_sizes = {};
    function tallyBlob (blob) {
        let offset = blob.get_offset();
        let length = blob.get_blob_size();
        let content_type = blob.get_content_type();

        if (offset > last_offset) {
            last_offset = offset;
            last_blob_bytes = length;
        }
        if (offset < first_offset) {
            first_offset = offset;
        }

        total_blob_bytes += length;
        n_blobs++;

        if (!content_type_sizes.hasOwnProperty(content_type)) {
            content_type_sizes[content_type] = [];
        }
        content_type_sizes[content_type].push(length);
    }

    records.forEach((record, i) => {
        record.list_blobs().map(tallyBlob);

        // Unfortunately, Spidermonkey isn't able to effectively track the
        // memory footprint of native objects like GBytes very well, so we
        // have to nudge it in the right direction every now and then.
        if (i%1000 === 0)
            imports.system.gc();
    });

    // Print summary

    print('Number of records:', records.length);
    print('Number of blobs:', n_blobs);

    let empty_bytes = last_offset - (first_offset + total_blob_bytes - last_blob_bytes);
    let wasted_pct = (empty_bytes / total_shard_bytes) * 100;
    let wasted_str = 'Wasted space between blobs: ' + fmt_size(empty_bytes);
    wasted_str += ' (' + wasted_pct.toPrecision(4) + '% wasted';
    wasted_str += ', average ' + fmt_size(empty_bytes/n_blobs) + ' per blob)';
    print(wasted_str);

    print();
    _print_shard_layout_summary(content_type_sizes, total_shard_bytes);
    print();
    _print_shard_layout_details(content_type_sizes, total_shard_bytes);
}

function fmt_size (size_bytes) {
    if (size_bytes < 1e3) {
        return size_bytes.toPrecision(4) + ' Bytes';
    } else if (size_bytes < 1e6) {
        let size_kbytes = size_bytes / 1e3;
        return size_kbytes.toPrecision(4) + ' KB';
    } else if (size_bytes < 1e9) {
        let size_mbytes = size_bytes / 1e6;
        return size_mbytes.toPrecision(4) + ' MB';
    } else {
        let size_gbytes = size_bytes / 1e9;
        return size_gbytes.toPrecision(4) + ' GB';
    }
}

function _print_shard_layout_summary (content_type_sizes, total_shard_bytes) {
    print('Shard layout summary:');

    // create a mapping of summary categories to the total size of their blobs
    let pattern_map = {
        'image/.*': 'Images',
        'text/.*': 'Articles',
        'application/pdf': 'Articles',
        'application/json': 'Metadata',
        'x-endlessm': 'Indexes',
        '.*': 'Other',
    };
    let category_size_map = {};
    let total_content_bytes = 0;
    for (let content_type in content_type_sizes) {
        for (let pattern in pattern_map) {
            if (!content_type.match(pattern))
                continue;
            let sizes = content_type_sizes[content_type];
            let size_bytes = sizes.reduce((a, b) => a + b, 0);
            let category = pattern_map[pattern];
            if (!category_size_map.hasOwnProperty(category))
                category_size_map[category] = 0;
            category_size_map[category] += size_bytes;
            total_content_bytes += size_bytes;
            break;
        }
    }

    // add a category for all non-blob content (i.e. overhead)
    let overhead_bytes = total_shard_bytes - total_content_bytes;
    category_size_map.Overhead = overhead_bytes;
    category_size_map.Total = total_shard_bytes;

    // turn the mapping into an array of category/size pairs
    let total_pct = 0;
    let category_sizes = Object.keys(category_size_map).map((category) => {
        let size_bytes = category_size_map[category];
        let pct_of_shard = size_bytes / total_shard_bytes * 100;
        let pct_str = pct_of_shard.toPrecision(4) + '%';
        total_pct += pct_of_shard;
        return {
            'Category': category,
            'Total size': fmt_size(size_bytes),
            'Pct of shard': pct_str,
        };
    });
    category_sizes.sort((e1, e2) => {
        let e1_pct = parseFloat(e1['Pct of shard'].slice(0, -1));
        let e2_pct = parseFloat(e2['Pct of shard'].slice(0, -1));
        return e1_pct > e2_pct ? -1 : 1;
    });
    _pretty_print_table(category_sizes);
}

function _print_shard_layout_details(content_type_sizes, total_shard_bytes) {
    print('Shard layout details:');
    let detail_elements = [];
    for (let content_type in content_type_sizes) {
        let max_bytes = 0, total_bytes = 0;
        let n_blobs = content_type_sizes[content_type].length;
        for (let size_bytes of content_type_sizes[content_type]) {
            total_bytes += size_bytes;
            if (size_bytes > max_bytes)
                max_bytes = size_bytes;
        }
        let avg_bytes = total_bytes / n_blobs;
        let pct_of_shard = total_bytes / total_shard_bytes * 100;

        detail_elements.push({
            'Content type': content_type,
            'Number of blobs': n_blobs,
            'Average size': fmt_size(avg_bytes),
            'Max size': fmt_size(max_bytes),
            'Total size': fmt_size(total_bytes),
            'Pct of shard': pct_of_shard.toPrecision(2) + '%',
        });
    }
    detail_elements.sort((e1, e2) => {
        let e1_pct = parseFloat(e1['Pct of shard'].slice(0, -1));
        let e2_pct = parseFloat(e2['Pct of shard'].slice(0, -1));
        return e1_pct > e2_pct ? -1 : 1;
    });

    _pretty_print_table(detail_elements);
}

function _pretty_print_table (elements) {
    let columns = Object.keys(elements[0]);
    let column_widths = columns.map((column) => {
        let max_width = column.length, min_width = column.length;
        elements.forEach((element) => {
            let value_length = element[column].toString().length;
            if (value_length > max_width)
                max_width = value_length;
            if (value_length < min_width)
                min_width = value_length;
        });

        // always ensure a buffer of at least a couple spaces between columns
        return Math.max(max_width, min_width + 4);
    });
    let header_str = columns.reduce((str, column, i) => {
        let width = column_widths[i];
        let spaces = ' '.repeat(width - column.length);
        return str + column + spaces + ' ';
    }, '');
    print(header_str);
    elements.forEach((element) => {
        let row = columns.reduce((str, column, i) => {
            let width = column_widths[i];
            let value = element[column].toString();
            let spaces = ' '.repeat(width - value.length);
            return str + value + spaces + ' ';
        }, '');
        print(row);
    });
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
