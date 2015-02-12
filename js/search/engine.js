// Copyright 2014 Endless Mobile, Inc.
const Lang = imports.lang;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Xapian = imports.gi.Xapian;

const ArticleObjectModel = imports.articleObjectModel;
const ContentObjectModel = imports.contentObjectModel;
const MediaObjectModel = imports.mediaObjectModel;
const xapianQuery = imports.xapianQuery;
const blacklist = imports.blacklist.blacklist;
const datadir = imports.datadir;
const utils = imports.searchUtils;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

function parseIntSane(str, fallback) {
    let n = parseInt(str, 10);
    return maybeNaN(n, fallback);
}

// Returns maybe if it's a number, otherwise returns fallback
function maybeNaN(maybe, fallback) {
    if (isNaN(maybe))
        return fallback;
    return maybe;
}

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

    _DEFAULT_LIMIT : 10, // if no limit is specified, return this many objects
    _DEFAULT_OFFSET : 0, // if no offset is specified, start from beginning
    _DEFAULT_CUTOFF_PCT : 20, // if no cutoff is specified, cutoff at 20%
    _DEFAULT_ORDER : 'asc', // if no order is specified, use ascending

    _init: function (params) {
        this.parent(params);

        // Caches domain => content path so that we don't have to hit the
        // disk on every object lookup.
        this._content_path_cache = {};

        // Caches domain => Xapian DB payload.
        this._databases = {};

        // Caches lang => Xapian Stemmer.
        this._stemmers = {};
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
        let query_obj = {
            limit: 1,
            ids: [id],
        };
        this._query(query_obj, (err, ret) => {
            if (typeof err !== 'undefined') {
                // error occurred during request, so immediately fail with err
                callback(err, undefined);
                return;
            }

            let model = ret.results[0];

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
     * Sends a request for to xapian-bridge for objects matching *query*.
     * *callback* is a function which takes *err* and *result* parameters.
     *
     * *query* is an object with many parameters controlling the search
     *   - q (search query string)
     *   - prefix (prefix search query string)
     *   - tags (list of tags the results must match)
     *   - offset (number of results to skip, useful for pagination)
     *   - limit  (maximum number of results to return)
     *   - cutoff  (number representing the minimum relevance percentage returned articles should have)
     *   - sortBy  (Xapian value by which to sort results. Note this will override relevance ordering by xapian.)
     *   - order  (The order in which to sort results, either ascending ('asc') or descending ('desc'))
     *   - ids (an array of specific EKN ids to be fetched)
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
    get_objects_by_query: function (query_obj, callback, cancellable = null, follow_redirects = true) {
        this._query(query_obj, (err, ret) => {
            if (typeof err !== 'undefined') {
                // error occurred during request, so immediately fail with err
                callback(err, undefined);
            } else {
                let results = ret.results;
                let get_more_results = (batch_size, new_callback) => {
                    query_obj.offset = ret.results.length + ret.offset;
                    query_obj.limit = batch_size;
                    this.get_objects_by_query(query_obj, new_callback);
                };
                if (follow_redirects) {
                    this._fetch_redirects_helper(results, callback,
                                                 get_more_results, cancellable);
                } else {
                    callback(undefined, results, get_more_results);
                }
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
        let get_redirects_query = {
            ids: redirects.map((result) => result.redirects_to),
        };
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

    _ensure_database: function (domain, cancellable) {
        if (this._databases[domain])
            return this._databases[domain];

        let content_path = this._content_path_from_domain(domain);
        let db_path = content_path + this._DB_PATH;

        let db = new Xapian.Database({ path: db_path });
        db.init(cancellable);

        let query_parser = new Xapian.QueryParser({ database: db });

        // Register prefixes
        let prefixes_metadata = JSON.parse(db.get_metadata("XbPrefixes"));
        prefixes_metadata['prefixes'].forEach(function(prefix) {
            query_parser.add_prefix(prefix['field'], prefix['prefix']);
        });
        prefixes_metadata['booleanPrefixes'].forEach(function(prefix) {
            query_parser.add_boolean_prefix(prefix['field'], prefix['prefix'], false);
        });

        let stopper = new Xapian.SimpleStopper();
        query_parser.set_stopper(stopper);

        let stopwords = JSON.parse(db.get_metadata("XbStopwords"));
        stopwords.forEach(function(stopword) {
            stopper.add(stopword);
        });

        let payload = { db: db, qp: query_parser };

        this._databases[domain] = payload;
        return payload;
    },

    _ensure_stemmer: function (lang) {
        if (this._stemmers[lang])
            return this._stemmers[lang];

        let stemmer = new Xapian.Stem({ language: lang });
        stemmer.init(null);
        this._stemmers[lang] = stemmer;
        return stemmer;
    },

    _get_xapian_query: function(query_obj, domain) {
        let xapian_query_options = [];
        for (let property in query_obj) {
            if (typeof query_obj[property] === 'undefined')
                throw new Error('Parameter value is undefined: ' + property);
            switch (property) {
                case 'tags':
                    xapian_query_options.push(xapianQuery.xapian_tag_clause(query_obj.tags));
                    break;
                case 'q':
                    xapian_query_options.push(xapianQuery.xapian_query_clause(query_obj.q));
                    break;
                case 'prefix':
                    xapian_query_options.push(xapianQuery.xapian_prefix_clause(query_obj.prefix));
                    break;
                case 'ids':
                    xapian_query_options.push(xapianQuery.xapian_ids_clause(query_obj.ids));
                    break;
                default:
                    if (['cutoff', 'limit', 'offset', 'order', 'sortBy', 'domain'].indexOf(property) === -1)
                        throw new Error('Unexpected property value ' + property);
            }
        }

        // Add blacklist tags to every query
        let explicit_tags = blacklist[domain];
        if (typeof explicit_tags !== 'undefined')
            xapian_query_options.push(xapianQuery.xapian_not_tag_clause(explicit_tags));

        return xapianQuery.xapian_join_clauses(xapian_query_options);
    },

    _query: function(query_obj, callback, cancellable = null) {
        let domain = query_obj['domain'];
        if (domain === undefined)
            domain = this.default_domain;

        let payload = this._ensure_database(domain, cancellable);

        let lang = this.language || 'none';

        let stemmer = this._ensure_stemmer(lang);
        payload.qp.set_stemmer(stemmer);
        payload.qp.set_stemming_strategy(Xapian.StemStrategy.STEM_SOME);

        let enquire = new Xapian.Enquire({ database: payload.db });
        enquire.init(null);

        let collapse = parseIntSane(query_obj['collapse'], this._DEFAULT_LIMIT);
        enquire.set_collapse_key(collapse);

        let sort_by = query_obj['sortBy'];
        if (sort_by) {
            let reverse = (query_obj['order'] == 'desc');
            enquire.set_sort_by_value(xapianQuery.xapian_string_to_value_no(sort_by), reverse);
        } else {
            let cutoff = parseIntSane(query_obj['cutoff'], this._DEFAULT_CUTOFF_PCT);
            enquire.set_cutoff(cutoff);
        }

        let flags = (Xapian.QueryParserFeature.DEFAULT |
                     Xapian.QueryParserFeature.WILDCARD |
                     Xapian.QueryParserFeature.PURE_NOT |
                     Xapian.QueryParserFeature.SPELLING_CORRECTION);

        let offset = parseIntSane(query_obj['offset'], this._DEFAULT_OFFSET);
        let limit = parseIntSane(query_obj['limit'], this._DEFAULT_LIMIT);

        let q = this._get_xapian_query(query_obj, domain);
        let parsed_query = payload.qp.parse_query_full(q, flags, '');
        enquire.set_query(parsed_query, parsed_query.get_length());

        let matches = enquire.get_mset(offset, limit);

        let iter = matches.get_begin();
        let results = [];
        while (iter.next()) {
            let document = iter.get_document();
            let data = this._parse_json_ld_message(document.get_data());
            let model = this._model_from_json_ld(data);
            results.push(model);
        }

        let ret = { results: results, offset: offset };
        callback(undefined, ret);
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
