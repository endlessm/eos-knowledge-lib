// Copyright 2014 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
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
         * Property: default-domain
         *
         * The domain to use to find content in case none is explicitly
         * passed into the query.
         *
         * e.g. animals-es
         */
        'default-domain': GObject.ParamSpec.string('default-domain',
            'Default Domain', 'The default domain to use for queries',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),

        /**
         * Property: default-domain-path
         *
         * The path to the default domains database, if unset will be search for
         * in XDG_DATA_DIRS normally.
         *
         * e.g. /endless/share/ekn/data/animals-es
         */
        'default-domain-path': GObject.ParamSpec.string('default-domain-path',
            'Default Domain Path', 'The path to the default domain database',
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
            let [domain, hash] = Utils.components_from_ekn_id(id);
            let domain_obj = this._get_domain(domain);

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
            if (query_obj.domain === '')
                query_obj = QueryObject.QueryObject.new_from_object(query_obj, { domain: this.default_domain });

            let domain_obj = this._get_domain(query_obj.domain);

            let do_query = (query_obj) => {
                domain_obj.get_objects_by_query(query_obj, cancellable, task.catch_callback_errors((domain_obj, query_task) => {
                    let results = domain_obj.get_objects_by_query_finish(query_task);

                    if (results.length === 0) {
                        task.return_value([[], null]);
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

                    task.return_value([results, more_results_query]);
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
     * Finishes a call to <get_objects_by_query>. Returns both a list of
     * <ContentObjectModels> and <QueryObject> which can be used to get more
     * results for the same query. Throws an error if one occurred.
     *
     * Parameters:
     *   task - The task returned by <get_objects_by_query>
     */
    get_objects_by_query_finish: function (task) {
        return task.finish();
    },

    _get_domain: function (domain) {
        if (this._domain_cache[domain] === undefined) {
            let domain_obj = Domain.get_domain_impl(domain, this._xapian_bridge);

            if (domain === this.default_domain && this.default_domain_path)
                domain_obj._content_path = this.default_domain_path;

            this._domain_cache[domain] = domain_obj;
        }

        return this._domain_cache[domain];
    },

    /**
     * Method: update_and_preload_default_domain
     *
     * Synchronously checks for updates to apply to the current domain.
     */
    update_and_preload_default_domain: function () {
        let domain = this._get_domain(this.default_domain);

        if (!GLib.getenv('EKN_DISABLE_UPDATES'))
            domain.check_for_updates();

        domain.load(null, () => {});
    },

    test_link: function (link) {
        return this._get_domain(this.default_domain).test_link(link);
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
