// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;
const Format = imports.format;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Soup = imports.gi.Soup;

const AsyncTask = imports.search.asyncTask;
const Config = imports.search.config;
const Utils = imports.search.utils;

const FileDownloadRequest = new Lang.Class({
    Name: 'FileDownloadRequest',

    _init: function (uri, out_file, csum) {
        this.uri = uri;
        this.out_file = out_file;
        this.csum = csum;
    },
});

const FileDownloader = new Lang.Class({
    Name: 'FileDownloader',

    _init: function () {
        this._http_session = new Soup.Session({ user_agent: 'ekn-downloader ',
                                                max_conns_per_host: 8 });

        // XXX: https://bugzilla.gnome.org/show_bug.cgi?id=655189
        // this._session.add_feature(new Soup.ProxyResolverDefault());
        Soup.Session.prototype.add_feature.call(this._http_session, new Soup.ProxyResolverDefault());

        this._requester = new Soup.Requester();
        Soup.Session.prototype.add_feature.call(this._http_session, this._requester);
    },

    verify_checksum: function (file, against_digest, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        task.catch_errors(() => {
            let stream = file.read(cancellable);
            let csum = new GLib.Checksum(GLib.ChecksumType.SHA256);

            function finish() {
                let digest = csum.get_string();
                if (against_digest.toLowerCase() !== digest.toLowerCase())
                    throw new Error(Format.vprintf("Checksum against file %s did not match: %s (local), %s (remote)", [file.get_basename(), digest, against_digest]));
                task.return_value(true);
            }

            function bytes_read(stream, res) {
                let bytes = stream.read_bytes_finish(res);
                csum.update(bytes.get_data());

                if (bytes.get_size() !== 0)
                    continue_checksum();
                else
                    finish();
            }

            function continue_checksum() {
                stream.read_bytes_async(Utils.CHUNK_SIZE, 0, cancellable, task.catch_callback_errors(bytes_read));
            }

            continue_checksum();
        });
        return task;
    },

    verify_checksum_finish: function (task) {
        return task.finish();
    },

    download_file: function (file_download_request, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        task.catch_errors(() => {
            let uri = file_download_request.uri;
            let out_file = file_download_request.out_file;

            let download_cancellable = new Gio.Cancellable();
            if (cancellable)
                cancellable.connect(() => {
                    download_cancellable.cancel();
                });

            function keep_new_file() {
                tmp_file.move(out_file, Gio.FileCopyFlags.OVERWRITE, cancellable, null);
                task.return_value(out_file);
            }

            function keep_existing_file() {
                download_cancellable.cancel();
                tmp_file.delete(cancellable);
                task.return_value(out_file);
            }

            let finish_download = (finish) => {
                // If we have a checksum, verify it.
                let csum = file_download_request.csum;

                if (csum) {
                    this.verify_checksum(tmp_file, csum, cancellable, task.catch_callback_errors((source, csum_task) => {
                        // XXX: If the file didn't checksum correctly, what should we do? Trash and re-download?
                        this.verify_checksum_finish(csum_task);
                        finish();
                    }));
                } else {
                    finish();
                }
            };

            let request = this._requester.request_uri(uri);

            let tmp_file = out_file.get_parent().get_child(out_file.get_basename() + '.part');

            if (tmp_file.query_exists(cancellable)) {
                let size = tmp_file.query_info('standard::size', Gio.FileQueryInfoFlags.NONE, cancellable).get_size();
                if (size > 0)
                    request.get_message().request_headers.set_range(size, -1);
            }

            request.send_async(download_cancellable, task.catch_callback_errors((request, result) => {
                // mirrors the SOUP_STATUS_IS_SUCCESSFUL macro
                function soup_status_is_successful(status) {
                    return status >= 200 && status < 300;
                }

                let body = request.send_finish(result);
                let msg = request.get_message();
                let status = msg.status_code;

                if (status === Soup.Status.REQUESTED_RANGE_NOT_SATISFIABLE) {
                    // The server is telling us we already have the full file range.
                    finish_download(keep_new_file);
                } else if (!soup_status_is_successful(status)) {
                    throw new Error("Server returned code " + status + " while fetching " + uri.to_string(true));
                } else {
                    let out_stream;
                    if (status === Soup.Status.PARTIAL_CONTENT) {
                        out_stream = tmp_file.append_to(Gio.FileCreateFlags.NONE, cancellable);
                    } else {
                        out_stream = tmp_file.replace(null, false, Gio.FileCreateFlags.NONE, cancellable);
                    }

                    out_stream.splice_async(body, Gio.OutputStreamSpliceFlags.NONE,
                                            GLib.PRIORITY_DEFAULT, cancellable, task.catch_callback_errors((source, res) => {
                                                out_stream.splice_finish(res);
                                                out_stream.close(cancellable);
                                                finish_download(keep_new_file);
                                            }));
                }
            }));
        });

        return task;
    },

    download_file_finish: function (task) {
        return task.finish();
    },
});

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

const SubscriptionDownloader = new Lang.Class({
    Name: 'SubscriptionDownloader',

    _init: function (app) {
        this._app = app;

        this._file_downloader = new FileDownloader();

        this._subscriptions_dir = Eknc.get_subscriptions_dir();
        Utils.ensure_directory(this._subscriptions_dir);

        this._load_from_config();

        this._ongoing_downloads = new Set();
    },

    _load_from_config: function () {
        let config_env = GLib.getenv('EKN_UPDATER_CONFIG');
        if (config_env === null)
            config_env = Config.PKGDATADIR + '/downloader.ini';

        let kf = GLib.KeyFile.new();
        kf.load_from_file(config_env, GLib.KeyFileFlags.NONE);
        this._server_host = kf.get_string("Repository", "ServerUrl");
    },

    _download_new_shards: function (directory, old_manifest, new_manifest, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);

        let old_shards = old_manifest.shards;
        // Verify that client shards actually appear on disk.
        old_shards = old_shards.filter((shard) => {
            let shard_file = directory.get_child(shard.path);
            return shard_file.query_exists(cancellable);
        });

        let new_shards = new_manifest.shards;

        // Download any shards that are not on the client.

        // XXX: We're currently indexing by filename, assuming it will be good enough.
        // Will it be, or should we also store e.g. ETag?
        let to_download = subtract_set(new_shards, old_shards, (shard) => shard.path);
        let to_delete = subtract_set(old_shards, new_shards, (shard) => shard.path);

        if (to_download.length === 0 && to_delete.length === 0) {
            task.return_value(false);
            return task;
        }

        AsyncTask.all(this, (add_task) => {
            to_download.forEach((shard) => {
                let shard_file = directory.get_child(shard.path);
                let shard_uri = Soup.URI.new(shard.download_uri);
                let shard_csum = shard.sha256_csum;

                let request = new FileDownloadRequest(shard_uri, shard_file, shard_csum);
                add_task((cancellable, callback) => this._file_downloader.download_file(request, cancellable, callback),
                         (task) => this._file_downloader.download_file_finish(task));
            });
        }, cancellable, task.catch_callback_errors((source, download_shards_task) => {
            AsyncTask.all_finish(download_shards_task);

            task.return_value(true);
        }));

        return task;
    },

    _download_new_shards_finish: function (task) {
        return task.finish();
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
        task._subscription_id = subscription_id;

        task.catch_errors(() => {
            this._app.hold();

            if (this._ongoing_downloads.has(subscription_id)) {
                task.return_value(false);
                return;
            }

            this._ongoing_downloads.add(subscription_id);

            let directory = this._subscriptions_dir.get_child(subscription_id);
            Utils.ensure_directory(directory);

            let manifest_file = directory.get_child('manifest.json');

            let old_manifest = load_manifest(manifest_file, cancellable);
            if (old_manifest === null)
                old_manifest = { shards: [] };

            let new_manifest_file = directory.get_child('manifest.json.new');
            let uri = Format.vprintf('%s/v1/%s/manifest.json', [this._server_host, subscription_id]);
            let manifest_uri = Soup.URI.new(uri);

            let request = new FileDownloadRequest(manifest_uri, new_manifest_file);
            this._file_downloader.download_file(request, cancellable, task.catch_callback_errors((source, download_task) => {
                try {
                    this._file_downloader.download_file_finish(download_task);
                } catch(e if e.matches(Gio.ResolverError, Gio.ResolverError.NOT_FOUND)) {
                    task.return_value(true);
                    return;
                }

                let new_manifest = load_manifest(new_manifest_file, cancellable);
                this._download_new_shards(directory, old_manifest, new_manifest, cancellable, task.catch_callback_errors((source, download_task) => {
                    let have_new_manifest = this._download_new_shards_finish(download_task);
                    if (!have_new_manifest)
                        new_manifest_file.delete(cancellable);

                    task.return_value(true);
                }));
            }));
        });

        return task;
    },

    fetch_update_finish: function (task) {
        this._app.release();
        this._ongoing_downloads.delete(task._subscription_id);
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
