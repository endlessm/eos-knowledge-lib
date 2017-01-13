// Copyright 2016 Endless Mobile, Inc.

const Gio = imports.gi.Gio;
const Lang = imports.lang;

const Utils = imports.search.utils;
const BaseDownloader = imports.search.downloader.base;

const DownloaderIface = "<node> \
<interface name='com.endlessm.EknSubscriptionsDownloader'> \
<method name='DownloadSubscription'> \
    <arg type='s' direction='in' name='subscription_id' /> \
</method> \
</interface> \
</node>";
const DownloaderProxy = Gio.DBusProxy.makeProxyWrapper(DownloaderIface);

const NDNDownloader = new Lang.Class({
    Name: 'NDNDownloader',
    Extends: 'BaseDownloader'

    _init: function (app) {
        this._app = app;

        this._subscriptions_dir = Utils.get_subscriptions_dir();
        Utils.ensure_directory(this._subscriptions_dir);
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

return NDNDownloader;
