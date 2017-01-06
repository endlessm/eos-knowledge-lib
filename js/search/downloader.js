// Copyright 2016 Endless Mobile, Inc.

const Format = imports.format;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Lang = imports.lang;

const AsyncTask = imports.search.asyncTask;
const Config = imports.search.config;
const Utils = imports.search.utils;

// Returns items that are in A but not in B.
function subtract_set (A, B, key) {
    let result = [];
    let mapped_A = A.map(key);
    let mapped_B = B.map(key);

    for (let i = 0; i < mapped_A.length; i++) {
        let item = mapped_A[i];
        if (mapped_B.indexOf(item) === -1)
            result.push(A[i]);
    }
    return result;
}

function load_manifest (file, cancellable) {
    try {
        let [success, data] = file.load_contents(cancellable);
        return JSON.parse(data);
    } catch (e if e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND)) {
        return null;
    }
}

const DownloaderIface = "<node> \
<interface name='com.endlessm.EknSubscriptionsDownloader'> \
<method name='DownloadSubscription'> \
    <arg type='s' direction='in' name='subscription_id' /> \
</method> \
</interface> \
</node>";
const DownloaderProxy = Gio.DBusProxy.makeProxyWrapper(DownloaderIface);

const SubscriptionDownloader = new Lang.Class({
    Name: 'SubscriptionDownloader',

    _init: function (app) {
        this._app = app;

        this._subscriptions_dir = Utils.get_subscriptions_dir();
        Utils.ensure_directory(this._subscriptions_dir);

        this._load_from_config();
    },

    _load_from_config: function () {
        let config_env = GLib.getenv('EKN_UPDATER_CONFIG');
        if (config_env === null)
            config_env = Config.PKGDATADIR + '/downloader.ini';

        let kf = GLib.KeyFile.new();
        kf.load_from_file(config_env, GLib.KeyFileFlags.NONE);
        this._server_host = kf.get_string("Repository", "ServerUrl");
    },

    apply_update: function (subscription_id, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);

        task.catch_errors(() => {
            this._app.hold();

            let directory = this._subscriptions_dir.get_child(subscription_id);
            if (!directory.query_exists(cancellable))
                return task.return_value(false);

            let new_manifest_file = directory.get_child('manifest.json.new');
            let new_manifest = load_manifest(new_manifest_file, cancellable);
            // If we don't have a new manifest, we don't have an update.
            if (new_manifest === null)
                return task.return_value(false);

            let manifest_file = directory.get_child('manifest.json');
            let old_manifest = load_manifest(manifest_file, cancellable);
            if (old_manifest === null)
                old_manifest = { shards: [] };

            // Make sure we have all shards before we can apply the update.
            let new_shards = new_manifest.shards;
            let have_all_shards = new_shards.every((shard) => {
                let shard_file = directory.get_child(shard.path);
                return shard_file.query_exists(cancellable);
            });

            if (!have_all_shards)
                return task.return_value(false);

            // OK, we're ready to go and can apply the update. Move our new manifest,
            // and then clean up the old shards.
            new_manifest_file.move(manifest_file, Gio.FileCopyFlags.OVERWRITE, cancellable, null);

            let old_shards = old_manifest.shards;
            let new_shards = new_manifest.shards;
            let to_delete = subtract_set(old_shards, new_shards, (shard) => shard.path);

            to_delete.forEach((shard) => {
                let shard_file = directory.get_child(shard.path);
                shard_file.delete(cancellable);
            });

            return task.return_value(true);
        });

        return task;
    },

    apply_update_finish: function (task) {
        this._app.release();
        return task.finish();
    },

    fetch_update: function (subscription_id, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);

        task.catch_errors(() => {
            let proxy = new DownloaderProxy(Gio.DBus.session, 'com.endlessm.EknSubscriptionsDownloader', '/com/endlessm/EknSubscriptionsDownloader');
            proxy.DownloadSubscriptionRemote(subscription_id);
        });

        return task;
    },

    fetch_update_finish: function (task) {
        return task.finish();
    },
});

let the_downloader = null;
let get_default = function () {
    if (the_downloader === null) {
        let app = Gio.Application.get_default();
        the_downloader = new SubscriptionDownloader(app);
    }
    return the_downloader;
};
