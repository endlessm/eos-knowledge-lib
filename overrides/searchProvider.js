const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const EosKnowledge = imports.gi.EosKnowledge;

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
</node> \
'

// Enum for error codes
const SearchProviderErrors = {
    RetrievalError: 0
};

const SearchProvider = Lang.Class({
    Name: 'EknSearchProvider',
    Extends: GObject.Object,

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

        this._search_domain = Gio.Application.get_default().application_id.split('.').pop();

        this._engine = new EosKnowledge.Engine();
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

    _run_query: function (terms, limit, cb) {
        let search_phrase = terms.join(' ');
        this._engine.get_objects_by_query(this._search_domain, {
            q: search_phrase,
            limit: limit,
        }, function (err, results) {
            cb(err, results);
        }.bind(this));
    },

    GetInitialResultSetAsync: function (params, invocation) {
        let app = Gio.Application.get_default();
        app.hold();

        let terms = params[0];
        this._run_query(terms, this.NUM_RESULTS, function (err, results) {
            if (!err) {
                this._add_results_to_cache(results);
                let ids = results.map(function (result) { return result.ekn_id });
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
        this._run_query(terms, this.NUM_RESULTS, function (err, results) {
            if (!err) {
                this._add_results_to_cache(results);
                let ids = results.map(function (result) { return result.ekn_id });
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
        model.fetch_all(this._engine);
        this.emit('load-page', model, query, timestamp);
    },

    LaunchSearch: function (terms, timestamp) {
        let query = terms.join(' ');
        this.emit('load-query', query, timestamp);
    },
});
