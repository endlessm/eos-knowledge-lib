// Copyright 2014 Endless Mobile, Inc.
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;

const ArticleObjectModel = imports.articleObjectModel;
const ContentObjectModel = imports.contentObjectModel;
const MediaObjectModel = imports.mediaObjectModel;
const xapianQuery = imports.xapianQuery;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

// Returns maybe if it's a number, otherwise returns fallback
function maybeNaN(maybe, fallback) {
    if (isNaN(maybe))
        return fallback;
    return maybe;
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
         * Property: content-path
         *
         * The path to the directory containing the database and media content.
         * Needs to be set!
         *
         * e.g. /endless/share/ekn/animals-es/
         */
        'content-path': GObject.ParamSpec.string('content-path',
            'Content Path', 'path to the directory containing the knowledge engine content',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),
    },

    _DB_PATH: '/db',
    _MEDIA_PATH: '/media',

    _DEFAULT_LIMIT : 10, // if no limit is specified, return this many objects
    _DEFAULT_OFFSET : 0, // if no offset is specified, start from beginning
    _DEFAULT_CUTOFF_PCT : 20, // if no cutoff is specified, cutoff at 20%
    _DEFAULT_ORDER : 'asc', // if no order is specified, use ascending

    _init: function (params) {
        this.parent(params);
        this._http_session = new Soup.Session();
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
        var query_obj = {
            limit: 1,
            id: id,
        };
        let req_uri = this.get_xapian_uri(query_obj);

        this._send_json_ld_request(req_uri, function (err, json_ld) {
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
            callback(undefined, model);
        }.bind(this), cancellable);
    },

    /**
     * Function: get_objects_by_query
     * Sends a request for to xapian-bridge for objects matching *query*.
     * *callback* is a function which takes *err* and *result* parameters.
     *
     * *query* is an object with many parameters controlling the search
     *   - q (search query string)
     *   - prefix (prefix search query string)
     *   - tag (comma delimited string of tags results must match)
     *   - offset (number of results to skip, useful for pagination)
     *   - limit  (maximum number of results to return)
     *   - cutoff  (number representing the minimum relevance percentage returned articles should have)
     *   - sortBy  (Xapian value by which to sort results. Note this will override relevance ordering by xapian.)
     *   - order  (The order in which to sort results, either ascending ('asc') or descending ('desc'))
     *
     * Parameters:
     *
     *   query - An object whose keys are query parameters, and values are
     *           strings.
     *   callback - A function which will be called after the request finished.
     *             The function should take two parameters: *error* and
     *             *result*, where *error* will only be defined if there was an
     *             error, and *result* is a list of <ContentObjectModel>s
     *             corresponding to the successfully retrieved object type
     */
    get_objects_by_query: function (query_obj, callback, cancellable = null) {
        let req_uri = this.get_xapian_uri(query_obj);

        this._send_json_ld_request(req_uri, function (err, json_ld) {
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
            let get_more_results = function (batch_size, new_callback) {
                query_obj.offset = json_ld.numResults + json_ld.offset;
                query_obj.limit = batch_size;
                this.get_objects_by_query(query_obj, new_callback);
            }.bind(this);
            callback(undefined, search_results, get_more_results);
        }.bind(this), cancellable);
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
            return Model.new_from_json_ld(json_ld, this.content_path + this._MEDIA_PATH);
        } else {
            throw new Error('No EKN model found for json_ld type ' + json_ld_type);
        }
    },

    // Returns a list of marshalled ObjectModels, or throws an error if json_ld
    // is not a SearchResults object
    _results_list_from_json_ld: function (json_ld) {
        return json_ld.results.map(this._model_from_json_ld.bind(this));
    },

    /**
     * Function: get_xapian_uri
     *
     * Constructs a URI to query the xapian bridge with the given query object.
     *
     * Parameters:
     *   query_obj - An object whose keys are query parameters, and values are
     *             strings.
     */
    get_xapian_uri: function (query_obj) {
        let host_uri = "http://" + this.host;
        let uri = new Soup.URI(host_uri);
        uri.set_port(this.port);
        uri.set_path('/query');

        let xapian_query_options = [];
        for (let property in query_obj) {
            if (typeof query_obj[property] === 'undefined')
                throw new Error('Parameter value is undefined: ' + property);
            switch (property) {
                case 'tag':
                    xapian_query_options.push(xapianQuery.xapian_tag_clause(query_obj.tag));
                    break;
                case 'q':
                    xapian_query_options.push(xapianQuery.xapian_query_clause(query_obj.q));
                    break;
                case 'prefix':
                    xapian_query_options.push(xapianQuery.xapian_prefix_clause(query_obj.prefix));
                    break;
                case 'id':
                    xapian_query_options.push(xapianQuery.xapian_id_clause(query_obj.id));
                    break;
                default:
                    if (['cutoff', 'limit', 'offset', 'order', 'sortBy'].indexOf(property) === -1)
                        throw new Error('Unexpected property value ' + property);
            }
        }

        let query_obj_out = {
            collapse: xapianQuery.XAPIAN_SOURCE_URL_VALUE_NO,
            cutoff: maybeNaN(query_obj['cutoff'], this._DEFAULT_CUTOFF_PCT),
            limit: maybeNaN(query_obj['limit'], this._DEFAULT_LIMIT),
            offset: maybeNaN(query_obj['offset'], this._DEFAULT_OFFSET),
            order: maybeNaN(query_obj['order'], this._DEFAULT_ORDER),
            path: this.content_path + this._DB_PATH,
            q: xapianQuery.xapian_join_clauses(xapian_query_options),
            sortBy: xapianQuery.xapian_string_to_value_no(query_obj['sortBy']),
        };

        uri.set_query(this.serialize_query(query_obj_out));
        return uri;
    },

    serialize_query: function (query_obj) {
        let stringify_and_encode = function (v) { return encodeURIComponent(String(v)); };

        return Object.keys(query_obj).filter(function (property) {
            return typeof query_obj[property] !== 'undefined';
        }).map(function (property) {
            return stringify_and_encode(property) + "=" + stringify_and_encode(query_obj[property]);
        }).join('&');
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

        this._http_session.queue_message(request, function(session, message) {
            let json_ld_response;
            try {
                let data = message.response_body.data;
                // The following is a patch for old databases. Prior to 2.3 the databases had the
                // old node.js knowledge engine routes hard coded. We will replace them
                // with the new ekn uri scheme.
                data = message.response_body.data.replace(/http:\/\/localhost:3003\/api\//g, 'ekn://');
                data = message.response_body.data.replace(/http:\/\/localhost:3003\//g, 'ekn://');
                // End patch
                json_ld_response = JSON.parse(data);
            } catch (err) {
                // JSON parse error
                callback(err, undefined);
                return;
            }
            callback(undefined, json_ld_response);
        });
        if (cancellable) {
            cancellable.connect(function () {
                this._http_session.cancel_message(request, Soup.Status.CANCELLED);
            }.bind(this));
        }
    }
});

let the_engine = null;
Engine.get_default = function () {
    if (the_engine === null)
        the_engine = new Engine();
    return the_engine;
};
