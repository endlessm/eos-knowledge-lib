// Copyright 2014 Endless Mobile, Inc.

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
                query_obj = QueryObject.QueryObject.new_from_object(query_obj, { app_id: this._default_app_id });

            let domain_obj = this._get_domain(query_obj.app_id);

            let do_query = (query_obj) => {
                domain_obj.get_objects_by_query(query_obj, cancellable, task.catch_callback_errors((domain_obj, query_task) => {
                    let [results, info] =
                        domain_obj.get_objects_by_query_finish(query_task);

                    if (results.length === 0) {
                        task.return_value([[], info]);
                        return;
                    }

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

            if (app_id === this._default_app_id && this.default_data_path)
                domain_obj._content_path = this.default_data_path;

            this._domain_cache[app_id] = domain_obj;
        }

        return this._domain_cache[app_id];
    },

    get_default_domain: function () {
        return this._get_domain(this._default_app_id);
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

        domain.load_sync();
    },

    test_link: function (link) {
        return this.get_default_domain().test_link(link);
    },

    set default_app_id (id) {
        if (this._default_app_id !== id) {
            this._default_app_id = id;
            this.notify('default-app-id');
        }
    },

    get default_app_id () {
        return this._default_app_id;
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

        // Tell EknVfs which one is the default domain
        the_engine.connect('notify::default-app-id', function () {
            let vfs = Gio.Vfs.get_default();

            if (GObject.type_name (vfs.constructor.$gtype) === "EknVfs")
                vfs.default_domain = the_engine.default_app_id;
        });
    }
    return the_engine;
};
