// Copyright 2016 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Soup = imports.gi.Soup;

const AsyncTask = imports.search.asyncTask;
const QueryObject = imports.search.queryObject;

/**
 * Class: XapianBridge
 */
const XapianBridge = new Lang.Class({
    Name: 'XapianBridge',
    GTypeName: 'EknXapianBridge',
    Extends: GObject.Object,

    _XB_QUERY_ENDPOINT: '/query',
    _XB_FIX_ENDPOINT: '/fix',

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
        this._http_session = new Soup.Session();
    },

    _build_xapian_uri: function (endpoint, domain_params, params) {
        let host_uri = 'http://' + this.host;
        let uri = new Soup.URI(host_uri);
        uri.set_port(this.port);
        uri.set_path(endpoint);
        Lang.copyProperties(domain_params, params);
        uri.set_query(this._serialize_query(params));
        return uri;
    },

    _get_xapian_fix_uri: function (query_obj, domain_params) {
        let uri_query_args = {
            q: query_obj.query,
        };

        return this._build_xapian_uri(this._XB_FIX_ENDPOINT, domain_params, uri_query_args);
    },

    _get_xapian_query_uri: function (query_obj, domain_params) {
        let uri_query_args = {
            cutoff: query_obj.get_cutoff(),
            lang: this.language,
            limit: query_obj.limit,
            offset: query_obj.offset,
            order: query_obj.order === QueryObject.QueryObjectOrder.ASCENDING ? 'asc' : 'desc',
            q: query_obj.get_query_parser_string(),
            sortBy: query_obj.get_sort_value(),
        };

        return this._build_xapian_uri(this._XB_QUERY_ENDPOINT, domain_params, uri_query_args);
    },

    _serialize_query: function (uri_query_args) {
        let stringify_and_encode = (v) => encodeURIComponent(String(v));

        return Object.keys(uri_query_args)
        .filter((property) =>
            typeof uri_query_args[property] !== 'undefined' &&
            uri_query_args[property] !== null &&
            uri_query_args[property] !== '')
        .map((property) =>
            stringify_and_encode(property) + '=' +
            stringify_and_encode(uri_query_args[property]))
        .join('&');
    },

    // Queues a SoupMessage for *uri* to the current http session. Calls
    // *callback* on any errors encountered and the parsed JSON.
    _send_json_ld_request: function (uri, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        task.catch_errors(() => {
            let request = new Soup.Message({
                method: 'GET',
                uri: uri,
            });
            this._http_session.queue_message(request, task.catch_callback_errors((session, message) => {
                if (message.status_code !== 200) {
                    throw new Error('Xapian bridge status code ' +
                        message.status_code + ' for URI ' +
                        message.uri.to_string(true) + ': ' +
                        message.reason_phrase);
                }
                let data = message.response_body.data;
                task.return_value(this._parse_json_ld_message(data));
            }));

            if (cancellable) {
                cancellable.connect(() => {
                    this._http_session.cancel_message(request, Soup.Status.CANCELLED);
                });
            }
        });
        return task;
    },

    _send_json_ld_request_finish: function (task) {
        return task.finish();
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

    get_fixed_query: function (query_obj, domain_params, cancellable, callback) {
        let task = new AsyncTask.AsyncTask(this, cancellable, callback);
        task.catch_errors(() => {
            let fix_req_uri = this._get_xapian_fix_uri(query_obj, domain_params);
            this._send_json_ld_request(fix_req_uri, cancellable, task.catch_callback_errors((engine, fix_query_task) => {
                let fixed_query_json = this._send_json_ld_request_finish(fix_query_task);
                let fixed_props = {};

                if (fixed_query_json.hasOwnProperty('stopWordCorrectedQuery')) {
                    fixed_props.stopword_free_query = fixed_query_json['stopWordCorrectedQuery'];
                }

                let new_query_object = QueryObject.QueryObject.new_from_object(query_obj, fixed_props);
                task.return_value(new_query_object);
            }));
        });
        return task;
    },

    get_fixed_query_finish: function (task) {
        return task.finish();
    },

    query: function (query_obj, domain_params, cancellable, callback) {
        let uri = this._get_xapian_query_uri(query_obj, domain_params);
        return this._send_json_ld_request(uri, cancellable, callback);
    },

    query_finish: function (task) {
        return this._send_json_ld_request_finish(task);
    },
});
