const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Engine = imports.engine;

const SearchIFace = '\
<node name="/" xmlns:doc="http://www.freedesktop.org/dbus/1.0/doc.dtd"> \
  <interface name="org.gnome.Shell.SearchProvider2"> \
    <method name="GetInitialResultSet"> \
      <arg type="as" name="Terms" direction="in" /> \
      <arg type="as" name="Results" direction="out" /> \
    </method> \
    <method name = "GetSubsearchResultSet"> \
      <arg type="as" name="PreviousResults" direction="in" /> \
      <arg type="as" name="Terms" direction="in" /> \
      <arg type="as" name="Results" direction="out" /> \
    </method> \
    <method name = "GetResultMetas"> \
      <arg type="as" name="Results" direction="in" /> \
      <arg type="aa{sv}" name="Metas" direction="out" /> \
    </method> \
    <method name = "ActivateResult"> \
      <arg type="s" name="Result" direction="in" /> \
      <arg type="as" name="Terms" direction="in" /> \
      <arg type="u" name="Timestamp" direction="in" /> \
    </method> \
    <method name = "LaunchSearch"> \
      <arg type="as" name="Terms" direction="in" /> \
      <arg type="u" name="Timestamp" direction="in" /> \
    </method> \
  </interface> \
</node>';

// Enum for error codes
const SearchProviderErrors = {
    RetrievalError: 0
};

const SearchProvider = Lang.Class({
    Name: 'EknSearchProvider',
    Extends: GObject.Object,

    Properties: {
        /**
         * Property: search_domain
         *
         * The Knowledge Engine domain from which to provide results
         */
        'search-domain': GObject.ParamSpec.string('search-domain',
            'Search Domain', 'Search Domain within knowledge engine',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, ''),
    },

    Signals: {
        'load-page': { param_types: [
            GObject.TYPE_OBJECT,
            GObject.TYPE_STRING,
            GObject.TYPE_UINT
        ] },
        'load-query': { param_types: [
            GObject.TYPE_STRING,
            GObject.TYPE_UINT
        ] },
    },

    NUM_RESULTS: 5,

    _init: function(args) {
        this.parent(args);

        this._impl = Gio.DBusExportedObject.wrapJSObject(SearchIFace, this);
        this._search_provider_domain = GLib.quark_from_string('Knowledge App Search Provider Error');

        this._search_results = null;
        this._more_results_callback = null;

        this._engine = new Engine.Engine();
        this._object_cache = {};
    },

    export: function (connection, path) {
        return this._impl.export(connection, path);
    },

    unexport: function (connection) {
        return this._impl.unexport_from_connection(connection);
    },

    _add_results_to_cache: function (results) {
        results.forEach(function (result) {
            this._object_cache[result.ekn_id] = result;
        }.bind(this));
    },

    _get_from_cache: function (id) {
        return this._object_cache[id];
    },

    get_results: function () {
        return this._search_results;
    },

    get_more_results_callback: function () {
        return this._more_results_callback;
    },

    _run_query: function (terms, limit, cb) {
        let search_phrase = terms.join(' ');
        if (this._cancellable)
            this._cancellable.cancel();
        this._cancellable = new Gio.Cancellable();
        this._engine.get_objects_by_query(this.search_domain, {
            q: search_phrase,
            limit: limit,
        }, function (err, results, more_results_callback) {
            cb(err, results, more_results_callback);
        }.bind(this), this._cancellable);
    },

    GetInitialResultSetAsync: function (params, invocation) {
        let app = Gio.Application.get_default();
        app.hold();

        let terms = params[0];
        this._run_query(terms, this.NUM_RESULTS, function (err, results, more_results_callback) {
            if (!err) {
                this._add_results_to_cache(results);
                this._search_results = results;
                this._more_results_callback = more_results_callback;
                let ids = results.map(function (result) { return result.ekn_id; });
                invocation.return_value(new GLib.Variant('(as)', [ids]));
            } else {
                invocation.return_error_literal(this._search_provider_domain, SearchProviderErrors.RetrievalError, 'Error retrieving results: ' + err);
            }
            app.release();
        }.bind(this));
    },

    GetSubsearchResultSetAsync: function (params, invocation) {
        let app = Gio.Application.get_default();
        app.hold();

        let previous = params[0];
        let terms = params[1];
        this._run_query(terms, this.NUM_RESULTS, function (err, results, more_results_callback) {
            if (!err) {
                this._add_results_to_cache(results);
                this._search_results = results;
                this._more_results_callback = more_results_callback;
                let ids = results.map(function (result) { return result.ekn_id; });
                invocation.return_value(new GLib.Variant('(as)', [ids]));
            } else {
                invocation.return_error_literal(this._search_provider_domain, SearchProviderErrors.RetrievalError, 'Error retrieving results: ' + err);
            }
            app.release();
        }.bind(this));
    },

    GetResultMetas: function (params) {
        let identifiers = params;

        let result_gvariants = [];
        let result_ekn_objects = identifiers.map(this._get_from_cache.bind(this));
        for (let obj of result_ekn_objects) {
            if (typeof obj !== 'undefined') {
                let displayTitle;
                if (typeof obj.originalTitle !== 'undefined') {
                    displayTitle = obj.originalTitle;
                } else {
                    displayTitle = obj.title;
                }

                let result = {
                    name: new GLib.Variant('s', displayTitle),
                    id: new GLib.Variant('s', obj.ekn_id),
                };

                if (typeof obj.synopsis !== 'undefined') {
                    result.description = new GLib.Variant('s', obj.synopsis);
                }
                result_gvariants.push(result);
            }
        }

        return result_gvariants;
    },

    ActivateResult: function (id, terms, timestamp) {
        let query = terms.join(' ');
        let model = this._get_from_cache(id);

        // if there's a cache miss (because the app auto-quit after a timeout
        // before the user activated a result), re-fetch it. otherwise just
        // emit the load-page signal with the cache result
        if (typeof model === 'undefined') {
            // id is a full EKN URI, but the engine operates in domains and
            // SHA ids (the last two components of the EKN URI path)
            let uri_parts = id.split('/');
            let obj_id = uri_parts.pop();
            let domain = uri_parts.pop();

            let query_obj = {
                'q': query
            };

            // If the cache misses, it's necessary to rerun the query to get the results set
            // before retrieving the requested article.
            this._engine.get_objects_by_query(domain, query_obj, function (err, results, callback) {
                this._search_results = results;
                this._more_results_callback = callback;

                this._engine.get_object_by_id(domain, obj_id, function (err, new_model) {
                    if (err) {
                        throw err;
                    } else {
                        this.emit('load-page', new_model, query, timestamp);
                    }
                }.bind(this));
            }.bind(this));
        } else {
            this.emit('load-page', model, query, timestamp);
        }
    },

    LaunchSearch: function (terms, timestamp) {
        let query = terms.join(' ');
        this.emit('load-query', query, timestamp);
    },
});
