// Copyright 2016 Endless Mobile, Inc.
const Soup = imports.gi.Soup;

const Lang = imports.lang;
const Gio = imports.gi.Gio;

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


const BaseDownloader = new Lang.Class({
    Name: 'BaseDownloader',

    _init: function (app) {
        this._app = app;
    },

    _download_new_shards_promise: function (directory, old_manifest, new_manifest, cancellable) {
        return Promise.resolve()
                      .then(() => {
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

                          if (to_download.length === 0 && to_delete.length === 0)
                              return false;

                          let downloads = to_download.map((shard) => {
                              let shard_file = directory.get_child(shard.path);
                              let shard_uri = Soup.URI.new(shard.download_uri);
                              let shard_csum = shard.sha256_csum;

                              let request = new FileDownloadRequest(shard_uri, shard_file, shard_csum);
                              return this._file_downloader.download_file_promise(request, cancellable);
                          });
                          return Promise.all(downloads).then(function () { return true; });
                      });
    },
    
    apply_update_sync: function (subscription_id, cancellable=null) {
        let directory = this._subscriptions_dir.get_child(subscription_id);
        if (!directory.query_exists(cancellable))
            return false;

        let new_manifest_file = directory.get_child('manifest.json.new');
        let new_manifest = load_manifest(new_manifest_file, cancellable);
        // If we don't have a new manifest, we don't have an update.
        if (new_manifest === null)
            return false;

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
            return false;

        // OK, we're ready to go and can apply the update. Move our new manifest,
        // and then clean up the old shards.
        new_manifest_file.move(manifest_file, Gio.FileCopyFlags.OVERWRITE, cancellable, null);

        let old_shards = old_manifest.shards;
        let to_delete = subtract_set(old_shards, new_shards, (shard) => shard.path);

        to_delete.forEach((shard) => {
            let shard_file = directory.get_child(shard.path);
            shard_file.delete(cancellable);
        });

        return true;
    },
    
    _load_manifest: function (file, cancellable) {
        try {
            let [success, data] = file.load_contents(cancellable);
            return JSON.parse(data);
        } catch (e if e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND)) {
            return null;
        }
    }
})

return BaseDownloader;
