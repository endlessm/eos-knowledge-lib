// Copyright 2014 Endless Mobile, Inc.
const Epak = imports.gi.Epak;
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;

const ArticleObjectModel = imports.search.articleObjectModel;
const ContentObjectModel = imports.search.contentObjectModel;
const MediaObjectModel = imports.search.mediaObjectModel;
const QueryObject = imports.search.queryObject;
const datadir = imports.search.datadir;
const utils = imports.search.searchUtils;

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

    _init: function (params) {
        this.parent(params);
        this._http_session = new Soup.Session();

        // Caches domain => content path so that we don't have to hit the
        // disk on every object lookup.
        this._content_path_cache = {};

        // Like _content_path_cache, but for EKN_VERSION files
        this._ekn_version_cache = {};

        this._epak_cache = {};
    },

    /**
     * Function: get_object_by_id
     * Fetches an object with ID *id*. *callback* is a function which takes
     * *err* and *result* parameters.
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
        let handle_result = (err, result) => {
            if (typeof err !== 'undefined') {
                // error occurred during request, so immediately fail with err
                callback(err, undefined);
                return;
            }

            let model;
            try {
                model = this._model_from_json_ld(result);
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
        };

        let [domain, __] = utils.components_from_ekn_id(id);
        let ekn_version = this._ekn_version_from_domain(domain);

        // Bundles with version >= 2 store all json-ld on disk instead of in the
        // Xapian DB itself, and hence require no HTTP request to xapian-bridge
        // when fetching an object
        if (ekn_version >= 2) {
            this._read_jsonld_from_disk(id, handle_result);
        } else {
            // Older bundles require an HTTP request for every object request
            var query_obj = new QueryObject.QueryObject({
                limit: 1,
                ids: [id],
                domain: domain,
            });
            let req_uri = this._get_xapian_uri(query_obj);

            this._send_json_ld_request(req_uri, (err, json_ld) => {
                if (typeof err !== 'undefined') {
                    callback(err, undefined);
                    return;
                }

                if (json_ld === null || typeof json_ld === "undefined"
                    || !json_ld.hasOwnProperty('results')) {
                    let err = new Error("Invalid xapian bridge response for " + req_uri.to_string(false));
                    callback(err, undefined);
                    return;
                }
                try {
                    let parsed_results = json_ld.results.map(JSON.parse);
                    handle_result(undefined, parsed_results[0]);
                } catch (err) {
                    handle_result(err, undefined);
                }
            }, cancellable);
        }
    },

    _read_jsonld_from_disk: function (ekn_id, callback, cancellable = null) {
        let [domain, hash] = utils.components_from_ekn_id(ekn_id);
        let pak = this._epak_from_domain(domain);
        let record = pak.find_record_by_hex_name(hash);

        if (record === null) {
            callback(new Error('Could not find epak record for ' + ekn_id), undefined);
            return;
        }

        let metadata_stream = record.metadata.get_stream();
        utils.read_stream_async(metadata_stream, (err, data) => {
            if (typeof err !== 'undefined') {
                callback(err, undefined);
                return;
            }

            try {
                let jsonld = JSON.parse(data);
                callback(undefined, jsonld);
            } catch (err) {
                // error parsing the JSON-LD from disk
                callback(err, undefined);
            }
        }, cancellable);
    },

    // Returns a GInputStream for the given EKN object's content. Only supports
    // v2+ app bundles.
    get_content_by_id: function (ekn_id) {
        let [domain, __] = utils.components_from_ekn_id(ekn_id);
        let ekn_version = this._ekn_version_from_domain(domain);
        if (ekn_version >= 2) {
           return this._read_content_from_disk(ekn_id);
        } else {
            throw new Error('Engine.get_content_by_id is not supported for legacy bundles');
        }
    },

    _read_content_from_disk: function (ekn_id) {
        let [domain, hash] = utils.components_from_ekn_id(ekn_id);
        let pak = this._epak_from_domain(domain);
        let record = pak.find_record_by_hex_name(hash);

        if (record === null) {
            throw new Error('Could not find epak record for ' + ekn_id);
        }

        let stream = record.data.get_stream();
        let content_type = record.data.get_content_type();

        return [stream, content_type];
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

            let search_results = [];
            try {
                if (json_ld === null)
                    throw new Error("Received null object response for " + req_uri.to_string(false));

                let get_more_results = (batch_size, new_callback) => {
                    let next_query_obj = QueryObject.QueryObject.new_from_object(query_obj, {
                        offset: json_ld.numResults + json_ld.offset,
                        limit: batch_size,
                    });
                    this.get_objects_by_query(next_query_obj, new_callback);
                };

                if (json_ld.results.length === 0) {
                    callback(undefined, [], get_more_results);
                    return;
                }

                // For knowledge bundles version >= 2, we only get an array of
                // EKN IDs back from xapian-bridge, so simply map
                // get_object_by_id over the ids and callback once we've got
                // them all
                let domain = query_obj.domain !== '' ? query_obj.domain : this.default_domain;
                let ekn_version = this._ekn_version_from_domain(domain);
                if (ekn_version >= 2) {
                    json_ld.results.forEach((ekn_id) => {
                        this.get_object_by_id(ekn_id, (err, model) => {
                            if (err) {
                                // On error, we want to callback with the err
                                // value and then set callback to be a noop,
                                // so that we don't repeatedly call the real
                                // callback more than once.
                                callback(err, undefined);
                                callback = () => {};
                                return;
                            }

                            search_results.push(model);
                            if (search_results.length === json_ld.numResults) {
                                callback(undefined, search_results, get_more_results);
                            }
                        }, cancellable);
                    });
                } else {
                    // we have a legacy bundle, so proceed assuming
                    // xapian-bridge gave us JSON-LD
                    try {
                        search_results = this._results_list_from_json_ld(json_ld);
                    } catch (err) {
                        // Error marshalling (at least) one of the JSON-LD results
                        callback(err, undefined);
                        return;
                    }
                    // For older bundles, we get JSON-LD in the xapian-bridge
                    // payload, and so can callback immediately; however, first
                    // we need to ensure no duplicates exist.
                    if (follow_redirects) {
                        this._fetch_redirects_helper(search_results, callback,
                            get_more_results, cancellable);
                    } else {
                        callback(undefined, search_results, get_more_results);
                    }
                }
            } catch (err) {
                // Error marshalling (at least) one of the JSON-LD results
                callback(err, undefined);
                return;
            }
        }, cancellable);
    },

    // recursively follow redirect chains, eventually invoking the original
    // callback on a final set of non-redirecting results. Only needed for
    // legacy (v1) bundles
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

    _ekn_version_from_domain: function (domain) {
        if (this._ekn_version_cache[domain] === undefined)
            this._ekn_version_cache[domain] = utils.get_ekn_version_for_domain(domain);

        return this._ekn_version_cache[domain];
    },

    _epak_path_from_domain: function (domain) {
        let content_path = this._content_path_from_domain(domain);

        let path_components = [content_path, 'media.epak'];
        let filename = GLib.build_filenamev(path_components);
        return filename;
    },

    _epak_from_domain: function (domain) {
        if (this._epak_cache[domain] === undefined) {
            let pak = new Epak.Pak({
                path: this._epak_path_from_domain(domain),
            });
            pak.init(null);
            this._epak_cache[domain] = pak;
        }

        return this._epak_cache[domain];
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
            let [domain, __] = utils.components_from_ekn_id(ekn_id);
            let ekn_version = this._ekn_version_from_domain(domain);
            let content_path = this._content_path_from_domain(domain);

            return Model.new_from_json_ld(json_ld, content_path + this._MEDIA_PATH, ekn_version);
        } else {
            throw new Error('No EKN model found for json_ld type ' + json_ld_type);
        }
    },

    // Returns a list of marshalled ObjectModels, or throws an error if json_ld
    // is not a SearchResults object
    _results_list_from_json_ld: function (json_ld) {
        let parsed_results = json_ld.results.map(JSON.parse);
        return parsed_results.map(this._model_from_json_ld.bind(this));
    },

    _get_xapian_uri: function (query_obj) {
        if (query_obj.domain === '')
            query_obj = QueryObject.QueryObject.new_from_object(query_obj, { domain: this.default_domain });

        let host_uri = "http://" + this.host;
        let uri = new Soup.URI(host_uri);
        uri.set_port(this.port);
        uri.set_path('/query');

        let uri_query_args = {
            collapse: query_obj.get_collapse_value(),
            cutoff: query_obj.get_cutoff(),
            lang: this.language,
            limit: query_obj.limit,
            offset: query_obj.offset,
            order: query_obj.order === QueryObject.QueryObjectOrder.ASCENDING ? 'asc' : 'desc',
            path: this._content_path_from_domain(query_obj.domain) + this._DB_PATH,
            q: query_obj.get_query_parser_string(),
            sortBy: query_obj.get_sort_value(),
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
