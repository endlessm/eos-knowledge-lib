// Copyright 2016 Endless Mobile, Inc.

const {DModel, EosShard, GLib, Gio} = imports.gi;
const ByteArray = imports.byteArray;
const Format = imports.format;
const System = imports.system;
const Utils = imports.framework.utils;

// For those interested in eminem's etymology, it goes roughly like this:
// Subscriptions -> Netflix -> Chill -> Ice Cube -> Eminem

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

    let out_stream = manifest_file.replace(null, false, Gio.FileCreateFlags.NONE, cancellable);
    out_stream.write_bytes(ByteArray.fromString(manifest_str), null);
}

function inspect_app_id (app_id) {
    let cancellable = null;

    let data_dir = DModel.get_data_dir(app_id, null);
    print(Format.vprintf("data dir: %s", [data_dir.get_path()]));

    let domain_obj = DModel.Engine.get_default().get_domain_for_app(app_id);

    let subscription_id = domain_obj.get_subscription_id();
    print(Format.vprintf("subscription ID: %s", [subscription_id]));
    print(Format.vprintf("subscription dir: %s", [get_subscription_dir(subscription_id, cancellable).get_path()]));
}

const USAGE = [
    'usage: eminem regenerate <directory>',
    '         Regenerate a manifest given a directory of shards.',
    '',
    '       eminem inspect-app-id <app_id>',
    '         Inspect various information about the given app ID.',
    '',
    'eminem is a subscription inspection utility for Knowledge Apps.',
].join('\n');

function main () {
    let argv = ARGV.slice();
    let action = argv.shift();

    if (action === 'regenerate' && argv.length === 1)
        regenerate(argv[0]);
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
