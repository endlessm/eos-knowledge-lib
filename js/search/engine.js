// Copyright 2014 Endless Mobile, Inc.

const Ekns = imports.gi.EosKnowledgeSearchPrivate;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const AsyncTask = imports.search.asyncTask;
const Domain = imports.search.domain;
const QueryObject = imports.search.queryObject;
const Utils = imports.search.utils;
const XapianBridge = imports.search.xapianBridge;

/**
 * Constant: HOME_PAGE_TAG
 * Special tag value indicating content for the app's home page
 */
const HOME_PAGE_TAG = 'EknHomePageTag';

/**
 * Class: Engine
 *
 * Engine represents the connection to the Knowledge Engine's API. It exposes
 * that API through two methods, <get_object_by_id> and <get_objects_by_query>.
 */
const Engine = Lang.Class({
    Name: 'Engine',
    GTypeName: 'EknEngine',
    Extends: GObject.Object,

    Properties: {
        /**
         * Property: default-app-id
         *
         * The app ID to use to find content for in case none is passed
         * into the query.
         *
         * e.g. com.endlessm.animals-es
         */
        'default-app-id': GObject.ParamSpec.string('default-app-id',
            'Default App ID', 'The default app ID to fetch data from',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),

        /**
         * Property: default-data-path
         *
         * The path to the default domains database, if unset will be search for
         * in XDG_DATA_DIRS normally.
         *
         * e.g. /endless/share/ekn/data/animals-es
         */
        'default-data-path': GObject.ParamSpec.string('default-data-path',
            'Default Domain Path', 'The path to the data of the default app ID',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),

        /**
         * Property: language
         *
         * The ISO639 language code which will be used for various search
         * features, such as term stemming and spelling correction.
         *
         * Defaults to empty string
         */
        'language': GObject.ParamSpec.string('language',
            'Language', 'ISO639 locale code to be used in search',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),
    },

    _init: function (params) {
        this.parent(params);

        this._xapian_bridge = new XapianBridge.XapianBridge({ language: this.language });

        this._domain_cache = {};

        this._uri_handler = new EknURIHandler(this);
    },

    /**
     * Function: get_object_by_id
     *
     * Asynchronously fetches an object with ID.
     *
     * Parameters:
     *   id - The unique ID for this object, of the form ekn://domain/sha
     *   cancellable - A Gio.Cancellable to cancel the async request.
     *   callback - A function which will be called after the request finished.
     *              The function will be called with the engine and a task object,
     *              as parameters. The task object can be used with
     *              <get_object_by_id_finish> to retrieve the result.
     */
    get_object_by_id: function (id, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        task.catch_errors(() => {
            let [hash] = Utils.components_from_ekn_id(id);
            let domain_obj = this.get_default_domain();

            domain_obj.get_object_by_id(id, cancellable, task.catch_callback_errors((domain_obj, domain_task) => {
                let model = domain_obj.get_object_by_id_finish(domain_task);
                task.return_value(model);
            }));
        });
        return task;
    },

    /**
     * Function: get_object_by_id_finish
     *
     * Finishes a call to <get_object_by_id>. Returns the <ContentObjectModel>
     * associated with the id requested, or throws an error if one occurred.
     *
     * Parameters:
     *   task - The task returned by <get_object_by_id>
     */
    get_object_by_id_finish: function (task) {
        return task.finish();
    },

    /**
     * Function: get_objects_by_query
     *
     * Asynchronously sends a request to xapian-bridge for a given *query_obj*,
     * and return a list of matching models.
     *
     * Parameters:
     *   query_obj - A <QueryObject> describing the query.
     *   cancellable - A Gio.Cancellable to cancel the async request.
     *   callback - A function which will be called after the request finished.
     *              The function will be called with the engine and a task object,
     *              as parameters. The task object can be used with
     *              <get_objects_by_query_finish> to retrieve the result.
     */
    get_objects_by_query: function (query_obj, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        task.catch_errors(() => {
            if (query_obj.app_id === '')
                query_obj = QueryObject.QueryObject.new_from_object(query_obj, { app_id: this.default_app_id });

            let domain_obj = this._get_domain(query_obj.app_id);

            let do_query = (query_obj) => {
                domain_obj.get_objects_by_query(query_obj, cancellable, task.catch_callback_errors((domain_obj, query_task) => {
                    let [results, info] =
                        domain_obj.get_objects_by_query_finish(query_task);

                    if (results.length === 0) {
                        task.return_value([[], info]);
                        return;
                    }

                    let more_results_query;
                    if (results.length < query_obj.limit) {
                        more_results_query = null;
                    } else {
                        more_results_query = QueryObject.QueryObject.new_from_object(query_obj, {
                            offset: results.length + query_obj.offset,
                        });
                    }
                    Object.defineProperty(info, 'more_results', {
                        value: more_results_query,
                    });

                    task.return_value([results, info]);
                }));
            };

            // If we have a user entered query string, we should fix it up.
            // Otherwise we can just query directly.
            if (query_obj.query) {
                domain_obj.get_fixed_query(query_obj, cancellable, task.catch_callback_errors((engine, fix_query_task) => {
                    query_obj = domain_obj.get_fixed_query_finish(fix_query_task);
                    do_query(query_obj);
                }));
            } else {
                do_query(query_obj);
            }
        });
        return task;
    },

    /**
     * Function: get_objects_by_query_finish
     *
     * Finishes a call to <get_objects_by_query>.
     * Returns both a list of <ContentObjectModels> and a dictionary with
     * results info.
     * Throws an error if one occurred.
     *
     * Members of the info object:
     *   more_results - <QueryObject> which can be used to get more results for
     *     the same query.
     *   upper_bound - an upper bound on the total number of results.
     *
     * Parameters:
     *   task - The task returned by <get_objects_by_query>
     */
    get_objects_by_query_finish: function (task) {
        return task.finish();
    },

    _get_domain: function (app_id) {
        if (this._domain_cache[app_id] === undefined) {
            let domain_obj = Domain.get_domain_impl(app_id, this._xapian_bridge);

            if (app_id === this.default_app_id && this.default_data_path)
                domain_obj._content_path = this.default_data_path;

            this._domain_cache[app_id] = domain_obj;
        }

        return this._domain_cache[app_id];
    },

    get_default_domain: function () {
        return this._get_domain(this.default_app_id);
    },

    /**
     * Method: update_and_preload_default_domain
     *
     * Synchronously checks for updates to apply to the current domain.
     */
    update_and_preload_default_domain: function () {
        let domain = this.get_default_domain();

        if (!GLib.getenv('EKN_DISABLE_UPDATES'))
            domain.check_for_updates();

        domain.load(null, () => {});
    },

    test_link: function (link) {
        return this.get_default_domain().test_link(link);
    },
});

const EknGFile = new Lang.Class({
    Name: 'EknGFile',
    Extends: GObject.Object,
    Implements: [Gio.File],

    _init: function (uri, blob) {
        this._uri = uri;
        this._blob = blob;
        this.parent();
    },

    vfunc_dup: function () {
        return new EknGFile(this._uri, this._blob);
    },

    vfunc_hash: function () {
        return GLib.str_hash(this._uri);
    },

    vfunc_equal: function (other) {
        return this._uri === other._uri;
    },

    vfunc_is_native: function () {
        return false;
    },

    vfunc_has_uri_scheme: function (scheme) {
        return scheme === 'ekn';
    },

    vfunc_get_uri_scheme: function () {
        return 'ekn';
    },

    vfunc_get_basename: function () {
        return this._uri.split('/').pop();
    },

    vfunc_get_path: function () {
        return null;
    },

    vfunc_get_uri: function () {
        return this._uri;
    },

    vfunc_get_parse_name: function () {
        return this._uri;
    },

    vfunc_get_parent: function () {
        return null;
    },

    vfunc_read_fn: function (cancellable) {
        return new Ekns.FileInputStreamWrapper({ stream: this._blob.get_stream() });
    },

    vfunc_query_info: function (attributes, flags, cancellable) {
        let blob = this._blob;
        let info = new Gio.FileInfo();
        let matcher = new Gio.FileAttributeMatcher(attributes);
        if (matcher.matches(Gio.FILE_ATTRIBUTE_STANDARD_SIZE))
            info.set_size(blob.uncompressed_size);
        if (matcher.matches(Gio.FILE_ATTRIBUTE_STANDARD_CONTENT_TYPE))
            info.set_content_type(blob.content_type);
        return info;
    },
});

const EknURIHandler = new Lang.Class({
    Name: 'EknURIHandler',

    _init: function (engine) {
        this._vfs = Gio.Vfs.get_default();
        this._engine = engine;

        this._vfs.register_uri_scheme('ekn', this._lookup_ekn_uri.bind(this), this._lookup_ekn_uri.bind(this));
    },

    _lookup_ekn_uri: function (vfs, uri) {
        let [hash, blob_name] = Utils.components_from_ekn_id(uri);

        let domain_obj = this._engine.get_default_domain();

        let record = domain_obj.load_record_from_hash_sync(hash);
        if (!record)
            return null;

        let blob;
        if (blob_name !== undefined)
            blob = record.lookup_blob(blob_name);
        else
            blob = record.data;

        if (!blob)
            return null;

        return new EknGFile(uri, blob);
    },
});

let the_engine = null;
let get_default = function () {
    if (the_engine === null) {
        // try to create an engine configured with the current locale
        var language = Utils.get_current_language();
        the_engine = new Engine({
            language: language,
        });
    }
    return the_engine;
};
