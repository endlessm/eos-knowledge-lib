// Copyright 2014 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const AsyncTask = imports.search.asyncTask;
const Domain = imports.search.domain;
const Utils = imports.search.utils;

/**
 * Class: Engine
 *
 * Engine represents the connection to the Knowledge Engine's API.
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

        this._xapian_bridge = new Eknc.XapianBridge({ language: this.language });

        this._domain_cache = {};
    },

    /**
     * Function: get_object_for_app
     *
     * Asynchronously fetches an object with ID for a given application.
     *
     * Parameters:
     *   id - The unique ID for this object, of the form ekn:///sha
     *   app_id - The id of the application the object belongs to. Will use the
     *            default-app-id if not set.
     *   cancellable - A Gio.Cancellable to cancel the async request.
     *   callback - A function which will be called after the request finished.
     *              The function will be called with the engine and a task object,
     *              as parameters. The task object can be used with
     *              <get_object_for_app> to retrieve the result.
     */
    get_object_for_app: function (id, app_id, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        task.catch_errors(() => {
            let [hash] = Utils.components_from_ekn_id(id);
            let domain_obj = this._get_domain(app_id);

            domain_obj.get_object(id, cancellable, task.catch_callback_errors((domain_obj, domain_task) => {
                let model = domain_obj.get_object_finish(domain_task);
                task.return_value(model);
            }));
        });
        return task;
    },

    /**
     * Function: get_object_for_app_finish
     *
     * Finishes a call to <get_object_for_app>. Returns the <ContentObjectModel>
     * associated with the id requested, or throws an error if one occurred.
     *
     * Parameters:
     *   task - The task returned by <get_object_for_app>
     */
    get_object_for_app_finish: function (task) {
        return task.finish();
    },

    /**
     * Function: get_object
     *
     * Asynchronously fetches an object with ID for the default application.
     * Requires the default-app-id property to be set.
     *
     * Parameters:
     *   id - The unique ID for this object, of the form ekn:///sha
     *   cancellable - A Gio.Cancellable to cancel the async request.
     *   callback - Completion callback see <get_object_for_app>.
     */
    get_object: function (id, cancellable, callback) {
        this._check_default_domain();
        this.get_object_for_app(id, this.default_app_id, cancellable, callback);
    },

    /**
     * Function: get_object_finish
     *
     * Finishes a call to <get_object>.
     *
     * Parameters:
     *   task - The task returned by <get_object>.
     */
    get_object_finish: function (task) {
        return this.get_object_for_app_finish(task);
    },

    /**
     * Function: get_objects_for_query
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
     *              <get_objects_for_query_finish> to retrieve the result.
     */
    get_objects_for_query: function (query_obj, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        task.catch_errors(() => {
            if (query_obj.app_id === '') {
                this._check_default_domain();
                query_obj = Eknc.QueryObject.new_from_object(query_obj, { app_id: this.default_app_id });
            }

            let domain_obj = this._get_domain(query_obj.app_id);

            let do_query = (query_obj) => {
                domain_obj.get_objects_for_query(query_obj, cancellable, task.catch_callback_errors((domain_obj, query_task) => {
                    let [results, info] =
                        domain_obj.get_objects_for_query_finish(query_task);

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
     * Function: get_objects_for_query_finish
     *
     * Finishes a call to <get_objects_for_query>.
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
     *   task - The task returned by <get_objects_for_query>
     */
    get_objects_for_query_finish: function (task) {
        return task.finish();
    },

    _get_domain: function (app_id) {
        if (this._domain_cache[app_id] === undefined)
            this._domain_cache[app_id] = Domain.get_domain_impl(app_id, this._xapian_bridge);

        return this._domain_cache[app_id];
    },

    /**
     * Method: get_default_domain
     *
     * Get the domain object for the default app id.
     */
    get_default_domain: function () {
        this._check_default_domain();
        return this._get_domain(this.default_app_id);
    },

    /**
     * Method: test_link
     * Parameters:
     *   link - The ekn id to test for, of the form ekn:///sha
     *   app_id - The id of the application to search for the link in. Will use the
     *            default-app-id if not set.
     *
     * Check if a link is is available in the default domain. Other domains are
     * currently not supported.
     */
    test_link: function (link, app_id) {
        if (!app_id) {
            this._check_default_domain();
            app_id = this.default_app_id;
        }

        return this._get_domain(app_id).test_link(link);
    },

    _check_default_domain: function () {
        if (!this.default_app_id)
            throw new Error('The default-app-id has not been set');
    },
});

let the_engine = null;
let get_default = function () {
    if (the_engine === null) {
        // try to create an engine configured with the current locale
        var language = Eknc.get_current_language();
        the_engine = new Engine({
            language: language,
        });
    }
    return the_engine;
};
