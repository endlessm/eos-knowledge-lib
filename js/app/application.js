imports.gi.versions.WebKit2 = '4.0';

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const LegacySearchProvider = imports.search.searchProvider;
const InteractionLoader = imports.app.interactionLoader;
const Utils = imports.search.utils;

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

/**
 * Class: Application
 */
const Application = new Lang.Class({
    Name: 'Application',
    GTypeName: 'EknApplication',
    Extends: Endless.Application,

    Properties: {
        /**
         * Property: resource-path
         * Path to applications gresource.
         */
        'resource-path': GObject.ParamSpec.string('resource-path',
            'Resource Path', 'Resource Path',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    _init: function (props={}) {
        this.parent(props);
        this._interaction = null;
        this._knowledge_search_impl = Gio.DBusExportedObject.wrapJSObject(KnowledgeSearchIface, this);

        Engine.get_default().default_domain = Utils.domain_from_app_id(this.application_id);

        this.add_main_option('data-path', 0, GLib.OptionFlags.NONE, GLib.OptionArg.FILENAME,
                             'Optional argument to set the default data path', null);

        // HACK for legacy compatibility: if the user has an old bundle with
        // a new eos-knowledge-lib, their search-provider ini files will have
        // the application ID rather than ekn-search-provider. Export an old
        // search provider for them.
        this._legacy_search_provider = new LegacySearchProvider.AppSearchProvider({
            application_id: this.application_id,
        });
    },

    vfunc_handle_local_options: function (options) {
        let path = options.lookup_value('data-path', null);
        if (path)
            Engine.get_default().default_domain_path = path.deep_unpack().toString();
        return -1;
    },

    vfunc_dbus_register: function (connection, path) {
        this.parent(connection, path);
        this._knowledge_search_impl.export(connection, path);
        this._legacy_search_provider.skeleton.export(connection, path);
        return true;
    },

    vfunc_dbus_unregister: function (connection, path) {
        this.parent(connection, path);
        this._knowledge_search_impl.unexport_from_connection(connection);
        this._legacy_search_provider.skeleton.unexport_from_connection(connection);
    },

    vfunc_startup: function () {
        this.parent();
        Engine.get_default().update_and_preload_default_domain();
    },

    LoadPage: function (ekn_id, query, timestamp) {
        this.ensure_interaction();
        this._interaction.activate_search_result(timestamp, ekn_id, query);
    },

    LoadQuery: function (query, timestamp) {
        this.ensure_interaction();
        this._interaction.search(timestamp, query);
    },

    vfunc_activate: function () {
        this.parent();
        this.ensure_interaction();
        this._interaction.desktop_launch(Gdk.CURRENT_TIME);
    },

    // To be overridden in subclass
    ensure_interaction: function () {
        if (this._interaction === null) {
            this._interaction = InteractionLoader.create_interaction(this, this.resource_path);
        }
    },

    vfunc_shutdown: function () {
        Dispatcher.get_default().pause();
        this.parent();
    },
});
