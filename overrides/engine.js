// Copyright 2014 Endless Mobile, Inc.
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;

const EosKnowledge = imports.gi.EosKnowledge;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

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
         * The hostname of the Knowledge Engine service. You generally don't
         * need to set this.
         *
         * Defaults to 'localhost'
         */
        'host': GObject.ParamSpec.string('host',
            'Knowledge Engine Hostname', 'HTTP hostname for the Knowledge Engine service',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            'localhost'),

        /**
         * Property: port
         *
         * The port of the Knowledge Engine service. You generally don't need
         * to set this.
         *
         * Defaults to 3000
         */
        'port': GObject.ParamSpec.int('port', 'Knowledge Engine Port',
            'The port of the Knowledge Engine service',
             GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
             -1, GLib.MAXINT32, 3000),
    },

    _init: function (params) {
        this.parent(params);
        this._http_session = new Soup.Session();
    },

    /**
     * Function: get_object_by_id
     * Sends a request for a Knowledge Engine object at *domain* with ID *id*.
     * *callback* is a function which takes *err* and *result* parameters.
     *
     * Parameters:
     *
     *   domain - The Knowledge Engine domain in which the requested object is
     *   stored
     *   id - The unique ID for this object. Usually a SHA1 hash
     *   callback - A function which will be called after the request finished.
     *             The function should take two parameters: *error* and *result*,
     *             *error* will only be defined if there was an error, and
     *             *result* where is an <ContentObjectModel> corresponding to
     *             the successfully retrieved object type
     */
    get_object_by_id: function (domain, id, callback) {
        let req_uri = this._construct_uri(domain, id);

        this._send_json_ld_request(req_uri, function (err, json_ld) {
            if (typeof err !== 'undefined') {
                // error occurred during request, so immediately fail with err
                callback(err, undefined);
            }

            try {
                let model = this._model_from_json_ld(json_ld);
                callback(undefined, model);
            } catch (err) {
                // Error marshalling the JSON-LD object
                callback(err, undefined);
            }
        }.bind(this));
    },

    /**
     * Function: get_objects_by_query
     * Sends a request for Knowledge Engine objects at *domain* matching
     * *query*. *callback* is a function which takes *err* and *result* parameters.
     * *query* is an object which has four possible options: q (querystring),
     * tags (comma delimited string of tags), prefix (string matching the prefix
     * of object titles) and limit (integer representing maximum number of
     * results to retrieve)
     *
     * Parameters:
     *
     *   domain - The Knowledge Engine domain in which the requested object is
     *            stored
     *   query - An object whose keys are query parameters, and values are
     *           strings.
     *   callback - A function which will be called after the request finished.
     *             The function should take two parameters: *error* and
     *             *result*, where *error* will only be defined if there was an
     *             error, and *result* is a list of <ContentObjectModel>s
     *             corresponding to the successfully retrieved object type
     */
    get_objects_by_query: function (domain, query_obj, callback) {
        let req_uri = this._construct_uri(domain, undefined, query_obj);

        this._send_json_ld_request(req_uri, function (err, json_ld) {
            if (typeof err !== 'undefined') {
                // error occurred during request, so immediately fail with err
                callback(err, undefined);
            }

            try {
                let search_results = this._results_list_from_json_ld(json_ld);
                callback(undefined, search_results);
            } catch (err) {
                // Error marshalling (at least) one of the JSON-LD results
                callback(err, undefined);
            }
        }.bind(this));
    },

    // Returns a marshaled ObjectModel based on json_ld's @type value, or throws
    // error if there is no corresponding model
    _model_from_json_ld: function (json_ld) {
        let ekn_model_by_ekv_type = {
            'ekv:ContentObject':
                EosKnowledge.ContentObjectModel,
            'ekv:ArticleObject':
                EosKnowledge.ArticleObjectModel
        };

        let json_ld_type = json_ld['@type'];
        if (ekn_model_by_ekv_type.hasOwnProperty(json_ld_type)) {
            let Model = ekn_model_by_ekv_type[json_ld_type];
            return Model.new_from_json_ld(json_ld);
        } else {
            throw new Error('No EKN model found for json_ld type ' + json_ld_type);
        }
    },

    // Returns a list of marshalled ObjectModels, or throws an error if json_ld
    // is not a SearchResults object
    _results_list_from_json_ld: function (json_ld) {
        if (json_ld['@type'] !== 'ekv:SearchResults') {
            throw new Error('Cannot marshal search results list from data of type ' + json_ld['@type']);
        }

        return json_ld.results.map(this._model_from_json_ld);
    },

    // Returns a SoupURI which represents the Knowledge Engine resource for
    // this object or query
    _construct_uri: function (domain, id, query_obj) {
        let host_uri = "http://" + this.host;
        let uri = new Soup.URI(host_uri);
        uri.set_port(this.port);

        if (typeof id !== 'undefined') {
            uri.set_path('/api/' + domain + '/' + id);
        } else {
            uri.set_path('/api/' + domain);
        }

        if (typeof query_obj !== 'undefined') {
            // turns query_obj into an array of 'param=encodedVal' strings
            let query_arr = Object.keys(query_obj).reduce(
                function (arr, param_name) {
                    // if this param_name has an array of values, add several
                    // individual 'param_name=val' strings to the list
                    // e.g. 'foo': ['bar', 'baz'] => ['foo=bar', 'foo=baz']
                    //
                    // otherwise just add 'param_name=val'
                    if (Array.isArray(query_obj[param_name])) {
                        return arr.concat(query_obj[param_name].map(function (v) {
                            return param_name + '=' + encodeURIComponent(v);
                        }));
                    } else {
                        let v = query_obj[param_name];
                        let arg = param_name + '=' + encodeURIComponent(v);
                        return arr.concat([arg]);
                    }
                }, []);

            // join those strings with '&'
            let query_string = query_arr.join('&');

            // set the uri querystring
            uri.set_query(query_string);
        }
        return uri;
    },

    // Queues a SoupMessage for *req_uri* to the current http session. Only
    // accepts JSON-LD responses, and calls *callback* on any errors encountered
    // and the parsed JSON
    _send_json_ld_request: function (req_uri, callback) {
        let request = new Soup.Message({
            method: 'GET',
            uri: req_uri
        });
        request.request_headers.replace('Accept', 'application/ld+json');

        this._http_session.queue_message(request, function(session, message) {
            let json_ld_response;
            try {
                json_ld_response = JSON.parse(message.response_body.data);
                callback(undefined, json_ld_response);
            } catch (err) {
                // JSON parse error
                callback(err, undefined);
            }
        });
    }
});
