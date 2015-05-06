
const Ekns = imports.gi.EosKnowledgeSearchPrivate;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Engine = imports.engine;
const QueryObject = imports.queryObject;

const SearchIface = '\
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
const SearchIfaceInfo = Gio.DBusInterfaceInfo.new_for_xml(SearchIface);

// Enum for error codes
const SearchProviderErrors = {
    RetrievalError: 0
};

const KnowledgeSearchIface = '\
<node> \
  <interface name="com.endlessm.KnowledgeSearch"> \
    <method name="LoadPage"> \
      <arg type="s" name="EknID" direction="in" /> \
      <arg type="s" name="Query" direction="in" /> \
      <arg type="u" name="Timestamp" direction="in" /> \
    </method> \
    <method name="LoadQuery"> \
      <arg type="s" name="Query" direction="in" /> \
      <arg type="u" name="Timestamp" direction="in" /> \
    </method> \
  </interface> \
</node>';
const KnowledgeSearchIfaceInfo = Gio.DBusInterfaceInfo.new_for_xml(KnowledgeSearchIface);

/**
 * Class: SearchProvider
 *
 * Adds search provider functionality to a knowledge app, to be used through
 * dbus by the shell's global search. To use you will need to extend the
 * vfunc_dbus_register and vfunc_dbus_unregister virtual functions on a
 * GApplication and call into the export and unexport function here. This class
 * will then run queries into the <search-domain> given and return the results
 * to the shell.
 *
 * Exposes two signals <load-page> and <load-query> when the shell asks
 * for a particular search result to be activated. You will want to connect
 * to both of those signals.
 */
const AppSearchProvider = Lang.Class({
    Name: 'EknAppSearchProvider',
    Extends: GObject.Object,

    Properties: {
        /**
         * Property: domain
         *
         * The domain to use to find content.
         *
         * e.g. animals-es
         */
        'domain': GObject.ParamSpec.string('domain',
            'Domain', 'The domain to use for queries',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            ''),
    },

    NUM_RESULTS: 5,
    MAX_DESCRIPTION_LENGTH: 200,

    _init: function(args) {
        this.parent(args);

        this.skeleton = Gio.DBusExportedObject.wrapJSObject(SearchIfaceInfo, this);
        this._search_provider_domain = GLib.quark_from_string('Knowledge App Search Provider Error');

        this._engine = new Engine.Engine.get_default();
        this._object_cache = {};

        this._app_proxy = null;
    },

    _ensure_app_proxy: function () {
        if (this._app_proxy !== null)
            return;
        let appID = 'com.endlessm.' + this.domain;
        let objectPath = '/com/endlessm/' + this.domain.replace(/\./g, '/').replace(/-/g, '_');
        this._app_proxy = new Gio.DBusProxy({ g_bus_type: Gio.BusType.SESSION,
                                              g_name: appID,
                                              g_object_path: objectPath,
                                              g_interface_info: KnowledgeSearchIfaceInfo,
                                              g_interface_name: KnowledgeSearchIfaceInfo.name,
                                              g_flags: (Gio.DBusProxyFlags.DO_NOT_AUTO_START_AT_CONSTRUCTION |
                                                        Gio.DBusProxyFlags.DO_NOT_LOAD_PROPERTIES) });
        this._app_proxy.init(null);
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
        if (this._cancellable)
            this._cancellable.cancel();
        this._cancellable = new Gio.Cancellable();
        let query_obj = new QueryObject.QueryObject({
            query: terms.join(' '),
            limit: limit,
            domain: this.domain,
        });
        this._engine.get_objects_by_query(query_obj, function (err, results, more_results_callback) {
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
                    let desc = obj.synopsis.substring(0, this.MAX_DESCRIPTION_LENGTH);
                    let displayDesc = GLib.markup_escape_text(desc, -1);
                    result.description = new GLib.Variant('s', displayDesc);
                }
                result_gvariants.push(result);
            }
        }

        return result_gvariants;
    },

    ActivateResult: function (id, terms, timestamp) {
        let query = terms.join(' ');
        this._ensure_app_proxy();
        this._app_proxy.LoadPageRemote(id, query, timestamp);
    },

    LaunchSearch: function (terms, timestamp) {
        let query = terms.join(' ');
        this._ensure_app_proxy();
        this._app_proxy.LoadQueryRemote(query, timestamp);
    },
});

const GlobalSearchProvider = new Lang.Class({
    Name: 'EknGlobalSearchProvider',

    _init: function() {
        this._dispatcher = new Ekns.SubtreeDispatcher({ interface_info: SearchIfaceInfo });
        this._dispatcher.connect('dispatch-subtree', Lang.bind(this, this._dispatchSubtree));
        this._appSearchProviders = {};
    },

    register: function(connection, path) {
        this._dispatcher.register(connection, path);
    },

    unregister: function(connection) {
        this._dispatcher.unregister();
    },

    _dispatchSubtree: function(dispatcher, subnode) {
        let domain = subnode.replace(/_/g, '-');
        if (!this._appSearchProviders[domain])
            this._appSearchProviders[domain] = new AppSearchProvider({ domain: domain });
        return this._appSearchProviders[domain].skeleton;
    },
});
