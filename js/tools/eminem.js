
const ByteArray = imports.byteArray;
const EosShard = imports.gi.EosShard;
const Format = imports.format;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Soup = imports.gi.Soup;
const System = imports.system;

const Datadir = imports.search.datadir;
const Domain = imports.search.domain;
const Utils = imports.search.utils;

// For those interested in eminem's etymology, it goes roughly like this:
// Subscriptions -> Netflix -> Chill -> Ice Cube -> Eminem

// The space at the end of the user-agent is intentional and adds libsoup's versioned signature to it.
let http_session = new Soup.Session({ user_agent: 'ekn-eminem ', });
Soup.Session.prototype.add_feature.call(http_session, new Soup.ProxyResolverDefault());

let requester = new Soup.Requester();
Soup.Session.prototype.add_feature.call(http_session, requester);

function download_file (out_file, uri, cancellable) {
    let request = requester.request(uri);
    let in_stream = request.send(cancellable);
    let out_stream = out_file.replace(null, false, Gio.FileCreateFlags.NONE, cancellable);
    out_stream.splice(in_stream, Gio.OutputStreamSpliceFlags.CLOSE_SOURCE | Gio.OutputStreamSpliceFlags.CLOSE_TARGET, cancellable);
}

function load_manifest (file, cancellable) {
    try {
        let [success, data] = file.load_contents(cancellable);
        return JSON.parse(data);
    } catch (e if e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND)) {
        return null;
    }
}

function download_subscription (subscription_id, out_dir, cancellable) {
    let manifest_uri = get_manifest_uri(subscription_id);
    let manifest_file = out_dir.get_child('manifest.json');

    download_file(manifest_file, manifest_uri, cancellable);

    let manifest = load_manifest(manifest_file, cancellable);
    manifest.shards.forEach((shard_entry) => {
        let shard_file = out_dir.get_child(shard_entry.path);
        let shard_uri = shard_entry.download_uri;
        download_file(shard_file, shard_uri, cancellable);
    });
}

function download_manifest (subscription_manifest, out_dir, cancellable) {
    subscription_manifest.subscriptions.forEach(function(entry) {
        let subscription_id = entry.id;
        let subscription_dir = out_dir.get_child(subscription_id);
        ensure_directory(subscription_dir);

        download_subscription(subscription_id, subscription_dir, cancellable);
    });
}

function ensure_directory (dir) {
    try {
        dir.make_directory_with_parents(null);
    } catch (e if e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS)) {
        // Directory already exists, we're good.
    }
}

function get_subscription_dir (subscription_id, cancellable) {
    let dir = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_user_data_dir(), 'com.endlessm.subscriptions', subscription_id]));
    if (!dir.query_exists(cancellable))
        fail_with_message(Format.vprintf("Could not find subscription ID: %s. Did you misspell it?", [subscription_id]));
    return dir;
}

function freeze (subscription_id) {
    let cancellable = null;

    let date = GLib.DateTime.new_now_local();
    let output_path = Format.vprintf('manifest-%s-%s.json', [subscription_id, date.format('%y%m%d_%H%M%S_UTC%z')]);
    let output_file = Gio.File.new_for_path(output_path);
    let subscription_dir = get_subscription_dir(subscription_id, cancellable);

    let manifest_file = subscription_dir.get_child('manifest.json');
    manifest_file.copy(output_file, Gio.FileCopyFlags.NONE, cancellable, null);

    print(Format.vprintf("Frozen to %s", [output_path]));
}

function unfreeze (subscription_id, input_path) {
    let cancellable = null;

    let subscription_dir = get_subscription_dir(subscription_id, cancellable);

    // 0 is stdin
    let input_stream;
    if (input_path !== undefined) {
        let input_file = Gio.File.new_for_commandline_arg(input_path);
        input_stream = input_file.read(cancellable);
    } else {
        input_stream = new Gio.UnixInputStream({ close_fd: false, fd: 0 });
    }
    let output_file = subscription_dir.get_child('manifest.json.new');
    let output_stream = output_file.replace(null, false, Gio.FileCreateFlags.NONE, cancellable);
    output_stream.splice(input_stream, Gio.OutputStreamSpliceFlags.CLOSE_SOURCE | Gio.OutputStreamSpliceFlags.CLOSE_TARGET, cancellable);

    let manifest = load_manifest(output_file, cancellable);

    manifest.shards.forEach(function(shard) {
        let shard_file = subscription_dir.get_child(shard.path);

        if (shard_file.query_exists(cancellable)) {
            print(Format.vprintf("%s - skipping, already exists.", [shard.path]));
        } else {
            print(Format.vprintf("%s - downloading...", [shard.path]));
            download_file(shard_file, shard.download_uri, cancellable);
        }
    });
}

function regenerate_manifest (subscription_dir, cancellable) {
    let manifest = {};

    let file_enum = subscription_dir.enumerate_children('standard::name,standard::type',
                                                        Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
    let info;

    manifest.version = '1';
    manifest.subscription_id = subscription_dir.get_basename();
    manifest.xapian_databases = [];
    manifest.shards = [];

    while ((info = file_enum.next_file(cancellable))) {
        let file = file_enum.get_child(info);
        let path = file.get_path();
        if (!path.endsWith('.shard'))
            continue;

        let shard_file = new EosShard.ShardFile({ path: path });
        shard_file.init(cancellable);

        // The Xapian DB is stored at this record ID in every shard.
        const XAPIAN_DB_RECORD_ID = GLib.compute_checksum_for_string(GLib.ChecksumType.SHA1, 'xapian-db', -1);

        let record = shard_file.find_record_by_hex_name(XAPIAN_DB_RECORD_ID);
        manifest.xapian_databases.push({
            path: file.get_basename(),
            offset: record.data.get_offset(),
        });
        manifest.shards.push({
            path: file.get_basename(),
        });
    }

    return manifest;
}

function regenerate (path) {
    let cancellable = null;

    let subscription_dir = Gio.File.new_for_path(path);
    let manifest = regenerate_manifest(subscription_dir, cancellable);
    let manifest_str = JSON.stringify(manifest, null, 2);

    let manifest_file = subscription_dir.get_child('manifest.json');
    let bytes = ByteArray.fromString(manifest_str).toGBytes();

    let out_stream = manifest_file.replace(null, false, Gio.FileCreateFlags.NONE, cancellable);
    out_stream.write_bytes(bytes, null);
}

function inspect_domain (domain) {
    let cancellable = null;

    print(Format.vprintf("domain: %s", [domain]));

    let data_dir = Datadir.get_data_dir_for_domain(domain);
    print(Format.vprintf("data dir: %s", [data_dir.get_path()]));

    let ekn_version = Utils.get_ekn_version_for_domain(domain);
    print(Format.vprintf("EKN_VERSION: %s", [ekn_version]));

    let domain_obj = Domain.get_domain_impl(domain, null);

    if (ekn_version === 1) {
        print(Format.vprintf("media dir: %s", [GLib.build_filenamev(data_dir, 'media')]));
        print(Format.vprintf("db dir: %s", [GLib.build_filenamev(data_dir, 'db')]));
    } else if (ekn_version === 2) {
        print(Format.vprintf("media shard: %s", [GLib.build_filenamev(data_dir, 'media.shard')]));
        print(Format.vprintf("db dir: %s", [GLib.build_filenamev(data_dir, 'db')]));
    } else if (ekn_version === 3) {
        let subscription_id = domain_obj.get_subscription_ids()[0];
        print(Format.vprintf("subscription ID: %s", [subscription_id]));
        print(Format.vprintf("subscription dir: %s", [get_subscription_dir(subscription_id, cancellable).get_path()]));
    }
}

function inspect_app_id (app_id) {
    let domain = Utils.domain_from_app_id(app_id);
    inspect_domain(domain);
}

const USAGE = [
    'usage: eminem freeze <subscription_id>',
    '         Freeze the current state of the subscription to a file in the current directory.',
    '',
    '       eminem unfreeze <subscription_id>',
    '         Restore the state of the subscription to the given manifest file (or stdin if not given).',
    '',
    '       eminem regenerate <directory>',
    '         Regenerate a manifest given a directory of shards.',
    '',
    '       eminem inspect-domain <domain>',
    '         Inspect various information about the given domain.',
    '',
    '       eminem inspect-app-id <app_id>',
    '         Inspect various information about the given app ID.',
    '',
    'eminem is a subscription inspection utility for Knowledge Apps.',
].join('\n');

function main () {
    let argv = ARGV.slice();
    let action = argv.shift();

    if (action === 'freeze' && argv.length === 1)
        freeze(argv[0]);
    else if (action === 'unfreeze' && (argv.length === 1 || argv.length === 2))
        unfreeze(argv[0], argv[1]);
    else if (action === 'regenerate' && argv.length === 1)
        regenerate(argv[0]);
    else if (action === 'inspect-domain' && argv.length === 1)
        inspect_domain(argv[0]);
    else if (action === 'inspect-app-id' && argv.length === 1)
        inspect_app_id(argv[0]);
    else
        fail_with_message(USAGE);
}

function fail_with_message () {
    // join args with space, a la print/console.log
    var args = Array.prototype.slice.call(arguments);
    printerr(args.join(' '));
    System.exit(1);
}
