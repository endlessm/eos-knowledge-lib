// Copyright 2016 Endless Mobile, Inc.

const Ekns = imports.gi.EosKnowledgeSearchPrivate;
const EosShard = imports.gi.EosShard;
const Format = imports.format;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Lang = imports.lang;

const ArticleObjectModel = imports.search.articleObjectModel;
const AsyncTask = imports.search.asyncTask;
const ContentObjectModel = imports.search.contentObjectModel;
const datadir = imports.search.datadir;
const MediaObjectModel = imports.search.mediaObjectModel;
const QueryObject = imports.search.queryObject;
const SetObjectModel = imports.search.setObjectModel;
const Utils = imports.search.utils;

// This hash is derived from sha1('link-table'), and for now is the hardcoded
// location of link tables for all shards.
const LINK_TABLE_ID = '4dba9091495e8f277893e0d400e9e092f9f6f551';

/**
 * Class: Domain
 */
const Domain = new Lang.Class({
    Name: 'Domain',
    Abstract: true,

    _init: function (app_id, xapian_bridge) {
        this._app_id = app_id;
        this._is_flatpak = Utils.app_is_flatpak();
        this._xapian_bridge = xapian_bridge;

        this._content_dir = null;
        this._shard_file = null;
    },

    _get_content_dir: function () {
        if (this._content_dir === null)
            this._content_dir = datadir.get_data_dir(this._app_id);

        return this._content_dir;
    },

    _get_content_path: function () {
        return this._get_content_dir().get_path();
    },

    // Returns a marshaled ObjectModel based on json_ld's @type value, or throws
    // error if there is no corresponding model
    _get_model_from_json_ld: function (json_ld) {
        let ekn_model_by_ekv_type = {
            'ekn://_vocab/ContentObject':
                ContentObjectModel.ContentObjectModel,
            'ekn://_vocab/ArticleObject':
                ArticleObjectModel.ArticleObjectModel,
            'ekn://_vocab/ImageObject':
                MediaObjectModel.ImageObjectModel,
            'ekn://_vocab/VideoObject':
                MediaObjectModel.VideoObjectModel,
            'ekn://_vocab/SetObject':
                SetObjectModel.SetObjectModel,
        };

        let json_ld_type = json_ld['@type'];
        if (!ekn_model_by_ekv_type.hasOwnProperty(json_ld_type))
            throw new Error('No EKN model found for json_ld type ' + json_ld_type);

        let Model = ekn_model_by_ekv_type[json_ld_type];
        return new Model({}, json_ld);
    },

    /**
     * Function: load_sync
     *
     * Private method, intended to be overridden by subclasses.
     *
     * Loads the domain from disk synchronously.
     */
    load_sync: function (cancellable) {
        throw new Error('Should be overridden in subclasses');
    },

    /**
     * Function: test_link
     *
     * Attempts to determine if the given link corresponds to content within
     * this domain. Returns an EKN URI to that content if so, and false
     * otherwise.
     */
    test_link: function (link) {
        throw new Error('Should be overridden in subclasses');
    },

    /**
     * Function: get_domain_query_params
     *
     * Gets the parameters to pass to the Xapian Bridge for this domain.
     * The domain *must* be loaded before calling!
     */
    get_domain_query_params: function () {
        throw new Error('Should be overridden in subclasses');
    },

    /**
     * Function: get_fixed_query
     *
     * Asynchronously sends a request for to xapian-bridge to correct a given
     * query object. The corrections can be zero or more of the following:
     *      - the query with its stop words removed
     *      - the query which has had spelling correction applied to it.
     *
     * Note that the spelling correction will be performed on the original
     * query string, and not the string with stop words removed.
     *
     * Parameters:
     *   query_obj - A <QueryObject> describing the query.
     *   cancellable - A Gio.Cancellable to cancel the async request.
     *   callback - A function which will be called after the request finished.
     *              The function will be called with the engine and a task object,
     *              as parameters. The task object can be used with
     *              <get_fixed_query_finish> to retrieve the result.
     */
    get_fixed_query: function (query_obj, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);

        task.catch_errors(() => {
            this.load_sync();

            let domain_params = this.get_domain_query_params();
            this._xapian_bridge.get_fixed_query(query_obj, domain_params, cancellable, task.catch_callback_errors((bridge, bridge_task) => {
                let result = this._xapian_bridge.get_fixed_query_finish(bridge_task);
                task.return_value(result);
            }));
        });

        return task;
    },

    /**
     * Function: get_fixed_query_finish
     *
     * Finishes a call to <get_fixed_query>. Returns a query object with the
     * corrections applied. Throws an error if one occurred.
     *
     * Parameters:
     *   task - The task returned by <get_fixed_query>
     */
    get_fixed_query_finish: function (task) {
        return task.finish();
    },

    resolve_xapian_result: function (result, cancellable, callback) {
        let id = result;
        return this.get_object_by_id(id, cancellable, callback);
    },

    resolve_xapian_result_finish: function (task) {
        return task.finish();
    },

    get_objects_by_query: function (query_obj, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        task.catch_errors(() => {
            this.load_sync();

            let domain_params = this.get_domain_query_params();
            this._xapian_bridge.query(query_obj, domain_params, cancellable, task.catch_callback_errors((bridge, query_task) => {
                let json_ld = this._xapian_bridge.query_finish(query_task);

                if (json_ld.results.length === 0) {
                    task.return_value([[], {}]);
                    return;
                }

                let info = {};
                Object.defineProperty(info, 'upper_bound', {
                    value: json_ld['upperBound'] || 0,
                });

                AsyncTask.all(this, (add_task) => {
                    json_ld.results.forEach((result) => {
                        add_task((cancellable, callback) => this.resolve_xapian_result(result, cancellable, callback),
                                 (task) => this.resolve_xapian_result_finish(task));
                    });
                }, cancellable, task.catch_callback_errors((source, resolve_task) => {
                    let results = AsyncTask.all_finish(resolve_task);
                    task.return_value([results, info]);
                }));
            }));
        });
        return task;
    },

    get_objects_by_query_finish: function (task) {
        return task.finish();
    },

    get_object_by_id: function (id, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        task.catch_errors(() => {
            let [hash] = Utils.components_from_ekn_id(id);
            let record = this.load_record_from_hash_sync(hash);
            let metadata_stream = record.metadata.get_stream();
            Utils.read_stream(metadata_stream, cancellable, task.catch_callback_errors((stream, stream_task) => {
                let data = Utils.read_stream_finish(stream_task);
                let json_ld = JSON.parse(data);
                task.return_value(this._get_model_from_json_ld(json_ld));
            }));
        });
        return task;
    },

    get_object_by_id_finish: function (task) {
        return task.finish();
    },

    /**
     * Function: check_for_updates
     *
     * Synchronously check for updates to the domain.
     */
    check_for_updates: function () {
        // By default, do nothing.
    },
});

// XXX Note that DomainV2 apps are no longer going to be generated in
// production, but we retain compatibility with it for the sake of
// developer-made test apps.
const DomainV2 = new Lang.Class({
    Name: 'DomainV2',
    Extends: Domain,

    _DB_DIR: 'db',
    _MEDIA_SHARD: 'media.shard',

    _get_shard_path: function () {
        let path_components = [this._get_content_path(), this._MEDIA_SHARD];
        let filename = GLib.build_filenamev(path_components);
        return filename;
    },

    _get_shard_file: function () {
        if (this._shard_file === null)
            this._shard_file = new EosShard.ShardFile({
                path: this._get_shard_path(),
            });

        return this._shard_file;
    },

    // We don't resolve links using the usual load() pattern because this
    // method needs to be synchronous, but we're guaranteed that the shard is
    // initialized by the time this is invoked by the HTML renderer.
    _setup_link_table: function () {
        // Ignore if we've already setup our table
        if (this._link_table !== undefined)
            return;

        let table_record = this._shard_file.find_record_by_hex_name(LINK_TABLE_ID);
        if (table_record)
            this._link_table = table_record.data.load_as_dictionary();
    },

    load_sync: function() {
        // Don't allow init() to be cancelled; otherwise, cancellation
        // will spoil the object for future use.
        let shard_file = this._get_shard_file();
        shard_file.init(null);
    },

    test_link: function (link) {
        if (this._link_table === undefined)
            return false;
        let ekn_id = this._link_table.lookup_key(link);
        if (!ekn_id) return false;
        return ekn_id;
    },

    get_domain_query_params: function () {
        let params = {};
        let path = GLib.build_filenamev([this._get_content_path(), this._DB_DIR]);
        if (this._is_flatpak) {
            params.flatpak_app_id = this._app_id;
            params.flatpak_path = path;
        } else {
            params.path = path;
        }
        return params;
    },

    load_record_from_hash_sync: function (hash) {
        this.load_sync();
        return this._shard_file.find_record_by_hex_name(hash);
    },
});

const DownloaderIface = '\
<node name="/" xmlns:doc="http://www.freedesktop.org/dbus/1.0/doc.dtd"> \
  <interface name="com.endlessm.EknDownloader"> \
    <method name = "ApplyUpdate"> \
      <arg type="s" name="subscription_id" direction="in" /> \
      <arg type="b" name="applied_update" direction="out" /> \
    </method> \
    <method name = "FetchUpdate"> \
      <arg type="s" name="subscription_id" direction="in" /> \
    </method> \
  </interface> \
</node>';
const DownloaderProxy = Gio.DBusProxy.makeProxyWrapper(DownloaderIface);

const DomainV3 = new Lang.Class({
    Name: 'DomainV3',
    Extends: Domain,

    _get_subscription_id: function () {
        let file = this._get_content_dir().get_child('subscriptions.json');
        let [success, data] = file.load_contents(null);
        let subscriptions = JSON.parse(data);

        // XXX: For now, we only support the first subscription.
        return subscriptions.subscriptions[0].id;
    },

    get_subscription_ids: function () {
        return [this._get_subscription_id()];
    },

    _get_subscription_dir: function () {
        if (this._subscription_dir === undefined) {
            let subscription_id = this._get_subscription_id();
            let user_data_dir = Gio.File.new_for_path(GLib.get_user_data_dir());
            this._subscription_dir = user_data_dir.get_child('com.endlessm.subscriptions').get_child(subscription_id);
            Utils.ensure_directory(this._subscription_dir);
        }

        return this._subscription_dir;
    },

    _get_manifest_file: function () {
        let subscription_dir = this._get_subscription_dir();
        let manifest_file = subscription_dir.get_child('manifest.json');
        return manifest_file;
    },

    _clean_up_old_symlinks: function (subscription_dir, cancellable) {
        let file_enum = subscription_dir.enumerate_children('standard::name,standard::type',
                                                            Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);

        let info;
        while ((info = file_enum.next_file(cancellable))) {
            let file = file_enum.get_child(info);
            if (!file.query_exists(cancellable))
                file.delete(cancellable);
        }
    },

    _get_bundle_dir: function () {
        let subscription_id = this._get_subscription_id();
        let content_dir = this._get_content_dir();
        let bundle_dir = content_dir.get_child('com.endlessm.subscriptions').get_child(subscription_id);
        return bundle_dir;
    },

    _make_bundle_symlinks: function (cancellable) {
        // In order to bootstrap content inside bundles while still keeping one subscriptions
        // directory, we symlink shards from the content bundle into the subscription directory.

        let bundle_dir = this._get_bundle_dir();
        let subscription_dir = this._get_subscription_dir();

        this._clean_up_old_symlinks(subscription_dir, cancellable);

        let manifest_file = this._get_manifest_file();
        let [success, data] = manifest_file.load_contents(cancellable);
        let manifest = JSON.parse(data);

        manifest.shards.forEach((shard_entry) => {
            let bundle_shard_file = bundle_dir.get_child(shard_entry.path);
            if (!bundle_shard_file.query_exists(cancellable))
                return;

            let subscription_shard_file = subscription_dir.get_child(shard_entry.path);

            try {
                // Symlink into the subscriptions dir.
                subscription_shard_file.make_symbolic_link(bundle_shard_file.get_path(), cancellable);
            } catch (e if e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS)) {
                // Shard already exists, we're good.
            }
        });
    },

    _load_shards: function (cancellable) {
        if (this._shards === undefined) {
            let manifest_file = this._get_manifest_file();

            // If the manifest.json doesn't exist, and we have a manifest in the bundle, symlink
            // to it to bootstrap our subscription.
            if (!manifest_file.query_exists(cancellable)) {
                let bundle_dir = this._get_bundle_dir();
                let bundle_manifest_file = bundle_dir.get_child('manifest.json');
                if (bundle_manifest_file.query_exists(cancellable))
                    manifest_file.make_symbolic_link(bundle_manifest_file.get_path(), cancellable);
            }

            this._make_bundle_symlinks(cancellable);

            let [success, data] = manifest_file.load_contents(cancellable);
            let manifest = JSON.parse(data);

            let subscription_dir = this._get_subscription_dir();
            this._shards = manifest.shards.map(function(shard_entry) {
                let file = subscription_dir.get_child(shard_entry.path);
                return new EosShard.ShardFile({
                    path: file.get_path(),
                });
            });
        }

        return this._shards;
    },

    test_link: function (link) {
        for (let table of this._link_tables) {
            let result = table.lookup_key(link);
            if (result !== null)
                return result;
        }
        return false;
    },

    // We don't resolve links using the usual load() pattern because this
    // method needs to be synchronous, but we're guaranteed that all shards are
    // initialized by the time this is invoked by the HTML renderer.
    _setup_link_tables: function () {
        // Ignore if we've already setup our tables
        if (this._link_tables !== undefined)
            return;

        let tables = this._shards.map((shard) => {
            let table_record = shard.find_record_by_hex_name(LINK_TABLE_ID);
            if (table_record) {
                return table_record.data.load_as_dictionary();
            } else {
                return null;
            }
        });

        // Filter out invalid tables
        this._link_tables = tables.filter((t) => t);
    },

    load_sync: function () {
        this._load_shards(null);

        // Don't allow init() to be cancelled; otherwise,
        // cancellation will spoil the object for future use.
        Ekns.utils_parallel_init(this._shards, 0, null);

        // Fetch the link table dictionaries from each shard for link lookups
        this._setup_link_tables();
    },

    get_domain_query_params: function () {
        let params = {};
        let manifest_path = this._get_manifest_file().get_path();
        if (this._is_flatpak) {
            params.flatpak_app_id = this._app_id;
            params.flatpak_manifest_path = manifest_path;
        } else {
            params.manifest_path = manifest_path;
        }
        return params;
    },

    load_record_from_hash_sync: function (hash) {
        this.load_sync();

        for (let i = 0; i < this._shards.length; i++) {
            let shard_file = this._shards[i];
            let record = shard_file.find_record_by_hex_name(hash);
            if (record)
                return record;
        }

        return null;
    },

    check_for_updates: function () {
        try {
            let proxy = new DownloaderProxy(Gio.DBus.session, 'com.endlessm.EknDownloader', '/com/endlessm/EknDownloader');

            // Synchronously apply any update we have.
            proxy.ApplyUpdateSync(this._get_subscription_id());

            // Regardless of whether or not we applied an update,
            // let's see about fetching a new one...
            proxy.FetchUpdateRemote(this._get_subscription_id());
        } catch(e) {
            logError(e, "Could not update domain");
        }
    },
});

/* Returns the EKN Version of the given app ID. Defaults to 1 if
   no EKN_VERSION file is found. This function does synchronous file I/O. */
function get_ekn_version (app_id) {
    let dir = datadir.get_data_dir(app_id);
    let ekn_version_file = dir.get_child('EKN_VERSION');
    try {
        let [success, contents, _] = ekn_version_file.load_contents(null);
        let version_string = contents.toString();
        return parseInt(version_string);
    } catch (e) {
        return 1;
    }
}

function get_domain_impl (app_id, xapian_bridge) {
    let ekn_version = get_ekn_version(app_id);
    let impls = {
        '2': DomainV2,
        '3': DomainV3,
    };

    let impl = impls[ekn_version];
    if (!impl)
        throw new Error(Format.vprintf('Invalid ekn version for app ID %s: %s', [app_id, ekn_version]));

    return new impl(app_id, xapian_bridge);
}
