const Engine = imports.search.engine;
const EosShard = imports.gi.EosShard;
const Gio = imports.gi.Gio;
const QueryObject = imports.search.queryObject;
const System = imports.system;

const USAGE = [
    'usage: kermit grep <shard path> <pattern>',
    '       kermit dump <shard path> <ekn id> [data|metadata]',
    '       kermit query <domain> "<querystring>"',
    '',
    'kermit is a shard inspection utility for Knowledge Apps.',
].join('\n');

// For those interested in kermit's etymology, it goes roughly like this:
// EosShard -> Dark Shard -> Dark Crystal -> Jim Hensen -> Kermit

// size of xapian-bridge result batches
const BATCH_SIZE = 10;

function main () {
    switch (ARGV[0]) {
        case 'grep':
            if (ARGV.length === 3) {
                grep(ARGV[1], ARGV[2]);
                break;
            }
        case 'dump':
            if (ARGV.length === 4) {
                dump(ARGV[1], ARGV[2], ARGV[3]);
                break;
            }
        case 'query':
            if (ARGV.length === 3) {
                query(ARGV[1], ARGV[2]);
                break;
            }
        default:
            fail_with_message(USAGE);
    }
}

function grep (path, pattern) {
    let shard = get_shard_for_path(path);
    let records = shard.list_records();
    records.forEach(function (record, i) {
        let regex = new RegExp(pattern);
        let metadata_text = record.metadata.load_contents().get_data().toString();

        if (metadata_text.match(regex) !== null) {
            let id = record.get_hex_name();
            let content_type = record.data.get_content_type();
            let title = JSON.parse(metadata_text).title;
            print_result(id, content_type, title);
        }

        // Unfortunately, Spidermonkey isn't able to effectively track the
        // memory footprint of native objects like GBytes very well, so we
        // have to nudge it in the right direction every now and then.
        if (i%1000 === 0)
            imports.system.gc();
    });
}

function query (domain, query_string) {
    let engine = new Engine.Engine();
    let query_obj = new QueryObject.QueryObject({
        query: query_string,
        limit: BATCH_SIZE,
        domain: domain,
    });
    perform_query(engine, query_obj);

    // run the mainloop so we don't exit before our callback fires
    imports.mainloop.run();
}

function perform_query (engine, query_obj) {
    engine.get_objects_by_query(query_obj, null, (engine, task) => {
        try {
            let [results, more_results] = engine.get_objects_by_query_finish(task);
            results.forEach(function (result) {
                let id = result.ekn_id.split('/').pop();
                print_result(id, result.content_type, result.title);
            });

            // if there were fewer than the requested number of results, that
            // means we're done.
            if (results.length < BATCH_SIZE) {
                System.exit(0);
            } else {
                perform_query(engine, more_results);
            }
        } catch (e) {
            fail_with_message(e);
        }
    });
}

function print_result (id, content_type, title) {
    let output = [
        id,
        content_type,
        // use JSON.stringify to escape title and wrap in quotes
        JSON.stringify(title),
    ].join(' - ');
    print(output);
}

function dump (path, id, data_or_meta) {
    if (['data', 'metadata'].indexOf(data_or_meta) === -1)
        fail_with_message(USAGE);

    let shard = get_shard_for_path(path);
    let record = shard.find_record_by_hex_name(id);
    if (record === null) {
        fail_with_message('Could not find shard entry for id', id);
    }

    let stdout = Gio.UnixOutputStream.new(1, false);
    let source = data_or_meta === 'data' ? record.data : record.metadata;
    stdout.splice(source.get_stream(), Gio.OutputStreamSpliceFlags.NONE, null);
}

function get_shard_for_path (path) {
    let shard;
    try {
        shard = new EosShard.ShardFile({
            path: path,
        });
        shard.init(null);
    } catch (e) {
        fail_with_message('Could not open shard at path', path, '-', e);
    }
    return shard;
}

function fail_with_message () {
    // join args with space, a la print/console.log
    var args = Array.prototype.slice.call(arguments);
    printerr(args.join(' '));
    System.exit(1);
}
