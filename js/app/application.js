const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
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

const Application = new Lang.Class({
    Name: 'Application',
    GTypeName: 'EknApplication',
    Extends: Endless.Application,

    _init: function (props={}) {
        this.parent(props);
        this._interaction = null;
        this._knowledge_search_impl = Gio.DBusExportedObject.wrapJSObject(KnowledgeSearchIface, this);

        Engine.Engine.get_default().default_domain = Utils.domain_from_app_id(this.application_id);

        // HACK for legacy compatibility: if the user has an old bundle with
        // a new eos-knowledge-lib, their search-provider ini files will have
        // the application ID rather than ekn-search-provider. Export an old
        // search provider for them.
        this._legacy_search_provider = new LegacySearchProvider.AppSearchProvider({
            application_id: this.application_id,
        });
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

    vfunc_window_removed: function (win) {
        if (this._interaction && this._interaction.view === win) {
            Dispatcher.get_default().reset();
            this._interaction = null;
        }
        this.parent(win);
    },

    // To be overridden in subclass
    ensure_interaction: function () {
        if (this._interaction === null) {
            Dispatcher.get_default().start();
            this._interaction = InteractionLoader.create_interaction(this, ARGV[1]);
        }
    },

    vfunc_shutdown: function () {
        Dispatcher.get_default().stop();
        this.parent();
    },
});
