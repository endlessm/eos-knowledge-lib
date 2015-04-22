// Copyright 2014 Endless Mobile, Inc.
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;

const ArticleObjectModel = imports.articleObjectModel;
const ContentObjectModel = imports.contentObjectModel;
const MediaObjectModel = imports.mediaObjectModel;
const QueryObject = imports.queryObject;
const xapianQuery = imports.xapianQuery;
const blacklist = imports.blacklist.blacklist;
const datadir = imports.datadir;
const utils = imports.searchUtils;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

function domain_from_ekn_id(ekn_id) {
    // Chop the URI off of an ekn id: 'ekn://football-es/hash' => 'football-es/hash'
    let stripped_ekn_id = ekn_id.slice('ekn://'.length);
    // Grab everything before the first slash.
    let domain = stripped_ekn_id.split('/')[0];
    return domain;
}

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
         * Property: host
         *
         * The hostname of the xapian bridge. You generally don't
         * need to set this.
         *
         * Defaults to '127.0.0.1'
         * FIXME: the default should just be localhost, but libsoup has a bug
         * whereby it does not resolve localhost when it is offline:
         * https://bugzilla.gnome.org/show_bug.cgi?id=692291
         * Once this bug is fixed, we should change this to be localhost.
         */
        'host': GObject.ParamSpec.string('host',
            'Knowledge Engine Hostname', 'HTTP hostname for the Knowledge Engine service',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            '127.0.0.1'),

        /**
         * Property: port
         *
         * The port of the xapian bridge. You generally don't need
         * to set this.
         *
         * Defaults to 3004
         */
        'port': GObject.ParamSpec.int('port', 'Knowledge Engine Port',
            'The port of the Knowledge Engine service',
             GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
             -1, GLib.MAXINT32, 3004),

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

    _DB_PATH: '/db',
    _MEDIA_PATH: '/media',

    _DEFAULT_CUTOFF: 10,
    _MATCH_SYNOPSIS_CUTOFF: 20,

    _init: function (params) {
        this.parent(params);
        this._http_session = new Soup.Session();

        // Caches domain => content path so that we don't have to hit the
        // disk on every object lookup.
        this._content_path_cache = {};
    },

    /**
     * Function: get_object_by_id
     * Sends a request for to xapian-bridge for an object with ID *id*.
     * *callback* is a function which takes *err* and *result* parameters.
     *
     * Parameters:
     *
     *   id - The unique ID for this object, of the form ekn://domain/sha
     *   callback - A function which will be called after the request finished.
     *             The function should take two parameters: *error* and *result*,
     *             *error* will only be defined if there was an error, and
     *             *result* where is an <ContentObjectModel> corresponding to
     *             the successfully retrieved object type
     */
    get_object_by_id: function (id, callback, cancellable = null) {
        var query_obj = new QueryObject.QueryObject({
            limit: 1,
            ids: [id],
        });
        let req_uri = this._get_xapian_uri(query_obj);

        this._send_json_ld_request(req_uri, (err, json_ld) => {
            if (typeof err !== 'undefined') {
                // error occurred during request, so immediately fail with err
                callback(err, undefined);
                return;
            }

            let model;
            try {
                if (json_ld === null)
                    throw new Error("Received null object response for " + req_uri.to_string(false));
                model = this._model_from_json_ld(json_ld.results[0]);
            } catch (err) {
                // Error marshalling the JSON-LD object
                callback(err, undefined);
                return;
            }

            // If the requested model should redirect to another, then fetch
            // that model instead.
            if (model.redirects_to.length > 0) {
                this.get_object_by_id(model.redirects_to, callback, cancellable);
            } else {
                callback(undefined, model);
            }
        }, cancellable);
    },

    /**
     * Function: get_objects_by_query
     * Sends a request for to xapian-bridge for a given *query_obj*.
     * *callback* is a function which takes *err* and *result* parameters.
     *
     * Parameters:
     *
     *   query_obj - A <QueryObject> describing the query.
     *   callback - A function which will be called after the request finished.
     *             The function should take two parameters: *error* and
     *             *result*, where *error* will only be defined if there was an
     *             error, and *result* is a list of <ContentObjectModel>s
     *             corresponding to the successfully retrieved object type
     */
    get_objects_by_query: function (query_obj, callback, cancellable = null, follow_redirects = true) {
        let req_uri = this._get_xapian_uri(query_obj);

        this._send_json_ld_request(req_uri, (err, json_ld) => {
            if (typeof err !== 'undefined') {
                // error occurred during request, so immediately fail with err
                callback(err, undefined);
                return;
            }

            let search_results;
            try {
                if (json_ld === null)
                    throw new Error("Received null object response for " + req_uri.to_string(false));
                search_results = this._results_list_from_json_ld(json_ld);
            } catch (err) {
                // Error marshalling (at least) one of the JSON-LD results
                callback(err, undefined);
                return;
            }
            let get_more_results = (batch_size, new_callback) => {
                let next_query_obj = QueryObject.QueryObject.new_from_object(query_obj, {
                    offset: json_ld.numResults + json_ld.offset,
                    limit: batch_size,
                });
                this.get_objects_by_query(next_query_obj, new_callback);
            };

            if (follow_redirects) {
                this._fetch_redirects_helper(search_results, callback,
                    get_more_results, cancellable);
            } else {
                callback(undefined, search_results, get_more_results);
            }
        }, cancellable);
    },

    // recursively follow redirect chains, eventually invoking the original
    // callback on a final set of non-redirecting results.
    _fetch_redirects_helper: function (results, callback, get_more_results, cancellable) {
        let redirects = results.filter((result) => result.redirects_to.length > 0);

        // if no more redirects are found, simply invoke the callback on the
        // current set of results
        if (redirects.length === 0) {
            callback(undefined, results, get_more_results);
            return;
        }

        // fabricate a query to request that resolves all redirect_to links in
        // the current set of results
        let get_redirects_query = new QueryObject.QueryObject({
            ids: redirects.map((result) => result.redirects_to),
        });
        this.get_objects_by_query(get_redirects_query, (err, redirect_targets) => {
            // if an error occurred, propagate err to original callback
            if (typeof err !== 'undefined') {
                callback(err, undefined);
                return;
            }

            // replace redirecting objects in original results set with their
            // newly fetched targets
            let redirected_results = results.map((old_result) => {
                // if old_result is one of the redirect objects, then find its
                // target object and return that instead
                if (redirects.indexOf(old_result) >= 0) {
                    for (let target of redirect_targets) {
                        if (old_result.redirects_to === target.ekn_id) {
                            return target;
                        }
                    }

                    // if we didn't find this redirect object's target, replace
                    // it with null so we can resolve with an error later
                    return null;
                } else {
                    // otherwise, old_result is a normal object, so just return
                    // it
                    return old_result;
                }
            });

            // if any of the redirect objects didn't get their requested target,
            // we'll have some null entries in redirected_results. invoke the
            // callback with an error in that case
            if (redirected_results.indexOf(null) !== -1) {
                callback(new Error('Could not resolve a redirect object'), undefined);
                return;
            }

            // recurse on the newly replaced result set, in case any of the
            // targets are themselves redirects
            this._fetch_redirects_helper(redirected_results, callback,
                get_more_results, cancellable);
        }, cancellable, false);
    },

    _content_path_from_domain: function (domain) {
        if (this._content_path_cache[domain] === undefined)
            this._content_path_cache[domain] = datadir.get_data_dir_for_domain(domain).get_path();

        return this._content_path_cache[domain];
    },

    // Returns a marshaled ObjectModel based on json_ld's @type value, or throws
    // error if there is no corresponding model
    _model_from_json_ld: function (json_ld) {
        let ekn_model_by_ekv_type = {
            'ekn://_vocab/ContentObject':
                ContentObjectModel.ContentObjectModel,
            'ekn://_vocab/ArticleObject':
                ArticleObjectModel.ArticleObjectModel,
            'ekn://_vocab/ImageObject':
                MediaObjectModel.ImageObjectModel,
            'ekn://_vocab/VideoObject':
                MediaObjectModel.VideoObjectModel,
        };

        let json_ld_type = json_ld['@type'];
        if (ekn_model_by_ekv_type.hasOwnProperty(json_ld_type)) {
            let Model = ekn_model_by_ekv_type[json_ld_type];

            let ekn_id = json_ld['@id'];
            let domain = domain_from_ekn_id(ekn_id);
            let content_path = this._content_path_from_domain(domain);

            return Model.new_from_json_ld(json_ld, content_path + this._MEDIA_PATH);
        } else {
            throw new Error('No EKN model found for json_ld type ' + json_ld_type);
        }
    },

    // Returns a list of marshalled ObjectModels, or throws an error if json_ld
    // is not a SearchResults object
    _results_list_from_json_ld: function (json_ld) {
        return json_ld.results.map(this._model_from_json_ld.bind(this));
    },

    _get_xapian_uri_query_clause: function (query_obj) {
        let query_clause_fn, do_match_all;

        if (query_obj.type === QueryObject.QueryObjectType.INCREMENTAL) {
            query_clause_fn = xapianQuery.xapian_incremental_query_clause;
        } else {
            query_clause_fn = xapianQuery.xapian_delimited_query_clause;
        }

        do_match_all = query_obj.match === QueryObject.QueryObjectMatch.TITLE_SYNOPSIS;

        return query_clause_fn(query_obj.query, do_match_all);
    },

    _get_xapian_cutoff_value: function (query_obj) {
        // We need a stricter cutoff when matching all against all indexed terms
        if (query_obj.match === QueryObject.QueryObjectMatch.TITLE_SYNOPSIS)
            return this._MATCH_SYNOPSIS_CUTOFF;
        return this._DEFAULT_CUTOFF;
    },

    _get_xapian_uri: function (query_obj) {
        let host_uri = "http://" + this.host;
        let uri = new Soup.URI(host_uri);
        uri.set_port(this.port);
        uri.set_path('/query');

        let xapian_query_options = [];
        if (query_obj.query.length > 0)
            xapian_query_options.push(this._get_xapian_uri_query_clause(query_obj));
        if (query_obj.tags.length > 0)
            xapian_query_options.push(xapianQuery.xapian_tag_clause(query_obj.tags));
        if (query_obj.ids.length > 0)
            xapian_query_options.push(xapianQuery.xapian_ids_clause(query_obj.ids));

        let domain = query_obj.domain || this.default_domain;

        let content_path = this._content_path_from_domain(domain);

        // Add blacklist tags to every query
        let explicit_tags = blacklist[domain];
        if (typeof explicit_tags !== 'undefined')
            xapian_query_options.push(xapianQuery.xapian_not_tag_clause(explicit_tags));

        let uri_query_args = {
            collapse: xapianQuery.XAPIAN_SOURCE_URL_VALUE_NO,
            cutoff: this._get_xapian_cutoff_value(query_obj),
            lang: this.language,
            limit: query_obj.limit,
            offset: query_obj.offset,
            order: query_obj.order === QueryObject.QueryObjectOrder.ASCENDING ? 'asc' : 'desc',
            path: content_path + this._DB_PATH,
            q: xapianQuery.xapian_join_clauses(xapian_query_options),
            sortBy: xapianQuery.xapian_sort_value_no(query_obj.sort),
        };

        uri.set_query(this._serialize_query(uri_query_args));
        return uri;
    },

    _serialize_query: function (uri_query_args) {
        let stringify_and_encode = (v) => encodeURIComponent(String(v));

        return Object.keys(uri_query_args)
        .filter((property) =>
            typeof uri_query_args[property] !== 'undefined' &&
            uri_query_args[property] !== null &&
            uri_query_args[property] !== '')
        .map((property) =>
            stringify_and_encode(property) + "=" +
            stringify_and_encode(uri_query_args[property]))
        .join('&');
    },

    // Queues a SoupMessage for *req_uri* to the current http session. Calls
    // *callback* on any errors encountered and the parsed JSON.
    _send_json_ld_request: function (req_uri, callback, cancellable = null) {
        if (cancellable && cancellable.is_cancelled())
            return;
        let request = new Soup.Message({
            method: 'GET',
            uri: req_uri
        });

        this._http_session.queue_message(request, (session, message) => {
            let json_ld_response;
            try {
                let data = message.response_body.data;
                json_ld_response = this._parse_json_ld_message(data);
            } catch (err) {
                // JSON parse error
                callback(err, undefined);
                return;
            }
            callback(undefined, json_ld_response);
        });
        if (cancellable) {
            cancellable.connect(() => {
                this._http_session.cancel_message(request, Soup.Status.CANCELLED);
            });
        }
    },

    _parse_json_ld_message: function (message) {
        // The following is a patch for old databases. Prior to 2.3 the databases had the
        // old node.js knowledge engine routes hard coded. We will replace them
        // with the new ekn uri scheme.
        message = message.replace(/http:\/\/localhost:3003\/api\//g, 'ekn://');
        message = message.replace(/http:\/\/localhost:3003\//g, 'ekn://');
        // End patch

        return JSON.parse(message);
    },
});

let the_engine = null;
Engine.get_default = function () {
    if (the_engine === null) {
        // try to create an engine configured with the current locale
        var language = utils.get_current_language();
        the_engine = new Engine({
            language: language,
        });
    }
    return the_engine;
};
