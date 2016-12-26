
const Eknc = imports.gi.EosKnowledgeContent;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Utils = imports.search.utils;

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
    <method name="LoadItem"> \
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

// https://www.freedesktop.org/software/systemd/man/sd_bus_path_encode.html
function systemd_bus_path_decode(string) {
    return string.replace(/_([a-zA-Z0-9]{2})/g, function(m, a) {
        return String.fromCharCode(parseInt(a, 16));
    });
}

/**
 * Class: SearchProvider
 *
 * A search provider for a single knowledge app, to be used through dbus by the
 * shell's global search. Requires the app id of the knowledge app it should run
 * searches for.
 *
 * This search provider will activate the actual knowledge app over dbus with a
 * result or search to display. As such, it can be used from in or outside of
 * the actual application process.
 */
const AppSearchProvider = Lang.Class({
    Name: 'EknAppSearchProvider',
    Extends: GObject.Object,

    Properties: {
        /**
         * Property: id
         * The app id of the application this provider is for.
         */
        'application-id': GObject.ParamSpec.string('application-id',
            'Application ID', 'Application ID',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
    },

    NUM_RESULTS: 5,
    MAX_DESCRIPTION_LENGTH: 200,

    _init: function(args) {
        this.parent(args);

        this.skeleton = Gio.DBusExportedObject.wrapJSObject(SearchIfaceInfo, this);
        this._search_provider_domain = GLib.quark_from_string('Knowledge App Search Provider Error');

        this._object_cache = {};

        this._app_proxy = null;
    },

    _ensure_app_proxy: function () {
        if (this._app_proxy !== null)
            return;
        this._app_proxy = new Gio.DBusProxy({ g_bus_type: Gio.BusType.SESSION,
                                              g_name: this.application_id,
                                              g_object_path: Utils.object_path_from_app_id(this.application_id),
                                              g_interface_info: KnowledgeSearchIfaceInfo,
                                              g_interface_name: KnowledgeSearchIfaceInfo.name,
                                              g_flags: (Gio.DBusProxyFlags.DO_NOT_AUTO_START_AT_CONSTRUCTION |
                                                        Gio.DBusProxyFlags.DO_NOT_LOAD_PROPERTIES) });
        this._app_proxy.init(null);
    },

    _add_models_to_cache: function (models) {
        models.forEach(function (model) {
            this._object_cache[model.ekn_id] = model;
        }.bind(this));
    },

    _get_from_cache: function (id) {
        return this._object_cache[id];
    },

    _get_results: function (terms, invocation) {
        if (this._cancellable)
            this._cancellable.cancel();
        this._cancellable = new Gio.Cancellable();

        let query = terms.join(' ');
        if (query.length === 0) {
            invocation.return_value(new GLib.Variant('(as)', [[]]));
            return;
        }

        let app = Gio.Application.get_default();
        app.hold();

        let query_obj = Eknc.QueryObject.new_from_props({
            query: query,
            limit: this.NUM_RESULTS,
            app_id: this.application_id,
        });
        Eknc.Engine.get_default().query(query_obj,
                                        this._cancellable,
                                        (engine, query_task) => {
            try {
                let results = engine.query_finish(query_task);
                this._add_models_to_cache(results.models);
                let ids = results.models.map(function (result) { return result.ekn_id; });
                invocation.return_value(new GLib.Variant('(as)', [ids]));
            } catch (error) {
                if (!error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)) {
                    logError(error);
                    invocation.return_error_literal(this._search_provider_domain,
                        SearchProviderErrors.RetrievalError,
                        'Error retrieving results: ' + error);
                } else {
                    invocation.return_gerror(error);
                }
            }
            app.release();
        });
    },

    GetInitialResultSetAsync: function (params, invocation) {
        this._get_results(params[0], invocation);
    },

    GetSubsearchResultSetAsync: function (params, invocation) {
        this._get_results(params[1], invocation);
    },

    GetResultMetas: function (params) {
        let identifiers = params;

        let result_gvariants = [];
        let result_ekn_objects = identifiers.map(this._get_from_cache.bind(this));
        for (let obj of result_ekn_objects) {
            if (typeof obj !== 'undefined') {
                let displayTitle;
                if (obj.originalTitle) {
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
        this._app_proxy.LoadItemRemote(id, query, timestamp);
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
        this._dispatcher = new Eknc.SubtreeDispatcher({ interface_info: SearchIfaceInfo });
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
        if (this._appSearchProviders[subnode])
            return this._appSearchProviders[subnode].skeleton;

        let app_id = systemd_bus_path_decode(subnode);
        let provider = new AppSearchProvider({ application_id: app_id });
        this._appSearchProviders[subnode] = provider;
        return provider.skeleton;
    },
});
