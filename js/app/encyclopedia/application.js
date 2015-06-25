imports.gi.versions.WebKit2 = '4.0';

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Config = imports.app.config;
const EncyclopediaModel = imports.app.encyclopedia.model;
const EncyclopediaPresenter = imports.app.encyclopedia.presenter;
const EncyclopediaView = imports.app.encyclopedia.view;
const Engine = imports.search.engine;
const LegacySearchProvider = imports.search.searchProvider;
const WebkitContextSetup = imports.app.webkitContextSetup;

const ENCYCLOPEDIA_APP_ID = 'com.endlessm.encyclopedia-en';

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

const EndlessEncyclopedia = new Lang.Class({
    Name:'EndlessEncyclopedia',
    Extends: Endless.Application,

    _init: function(props) {
        this.parent(props);
        this._presenter = null;
        this._knowledge_search_impl = Gio.DBusExportedObject.wrapJSObject(KnowledgeSearchIface, this);

        let domain = this.application_id.split('.').pop();
        Engine.Engine.get_default().default_domain = domain;

        // HACK for legacy compatibility: if the user has an old bundle with
        // a new eos-knowledge-lib, their search-provider ini files will have
        // the application ID rather than ekn-search-provider. Export an old
        // search provider for them.
        this._legacy_search_provider =
            new LegacySearchProvider.AppSearchProvider({ domain: domain });
    },

    vfunc_dbus_register: function(connection, path) {
        this.parent(connection, path);
        this._knowledge_search_impl.export(connection, path);
        this._legacy_search_provider.skeleton.export(connection, path);
        return true;
    },

    vfunc_dbus_unregister: function(connection, path) {
        this.parent(connection, path);
        this._knowledge_search_impl.unexport_from_connection(connection);
        this._legacy_search_provider.skeleton.unexport_from_connection(connection);
    },

    LoadPage: function(ekn_id, query, timestamp) {
        this._ensure_presenter();
        this._presenter.activate_search_result(timestamp, ekn_id, query);
    },

    LoadQuery: function(query, timestamp) {
        this._ensure_presenter();
        this._presenter.search(timestamp, query);
    },

    vfunc_activate: function () {
        this.parent();
        this._ensure_presenter();
        this._presenter.desktop_launch(Gdk.CURRENT_TIME);
    },

    vfunc_window_removed: function(win) {
        if (this._view === win) {
            this._view = null;
            this._presenter = null;
        }
        this.parent(win);
    },

    _ensure_presenter: function () {
        if (this._presenter !== null)
            return;

        // Load web extensions for translating
        WebkitContextSetup.register_webkit_extensions(this.application_id);

        // Register resource
        let resource = Gio.Resource.load(Config.PKGDATADIR + '/eos-knowledge.gresource');
        resource._register();

        this._model = new EncyclopediaModel.EncyclopediaModel();
        this._view = new EncyclopediaView.EncyclopediaView({
            application: this,
        });
        this._presenter =
            new EncyclopediaPresenter.EncyclopediaPresenter(this._view, this._model);

        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/css/endless_encyclopedia.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    },
});

let app = new EndlessEncyclopedia({
    application_id: ARGV[0] ? ARGV[0] : ENCYCLOPEDIA_APP_ID,
    inactivity_timeout: 12000,
    image_attribution_file: Gio.File.new_for_uri('resource:///com/endlessm/knowledge/credits.json'),
});

app.run(ARGV);
