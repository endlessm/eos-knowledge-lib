imports.gi.versions.WebKit2 = '4.0';

const Endless = imports.gi.Endless;
const Gio = imports.gi.Gio;
const Lang = imports.lang;

const Config = imports.app.config;
const Engine = imports.search.engine;
const SearchProvider = imports.search.searchProvider;

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
        this._activation_timestamp = null;
        this._knowledge_search_impl = Gio.DBusExportedObject.wrapJSObject(KnowledgeSearchIface, this);

        let domain = this.application_id.split('.').pop();
        Engine.Engine.get_default().default_domain = domain;

        // HACK for legacy compatibility: if the user has an old bundle with
        // a new eos-knowledge-lib, their search-provider ini files will have
        // the application ID rather than ekn-search-provider. Export an old
        // search provider for them.
        this._legacy_search_provider = new SearchProvider.AppSearchProvider({ domain: domain });
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
        this._activation_timestamp = timestamp;
        this.activate();
        this._activation_timestamp = null;
        this._presenter.load_uri(ekn_id);
    },

    LoadQuery: function(query, timestamp) {
        this._activation_timestamp = timestamp;
        this.activate();
        this._activation_timestamp = null;
        this._presenter.do_search(query);
    },

    vfunc_activate: function () {
        if (!this._presenter) {
            // Keep all imports local to activate if possible. We want the
            // application to start up wicked fast when we are only activating
            // the search provider and have no need for the frontend of the app
            // yet
            const Gdk = imports.gi.Gdk;
            const Gtk = imports.gi.Gtk;
            const EncyclopediaView = imports.app.encyclopedia.view;
            const EncyclopediaPresenter = imports.app.encyclopedia.presenter;
            const EncyclopediaModel = imports.app.encyclopedia.model;
            const WebkitContextSetup = imports.app.webkitContextSetup;

            // Load web extensions for translating
            WebkitContextSetup.register_webkit_extensions(this.application_id);

            // Register resource
            let resource = Gio.Resource.load(Config.PKGDATADIR + '/eos-knowledge.gresource');
            resource._register();

            this._model = new EncyclopediaModel.EncyclopediaModel();
            this._view = new EncyclopediaView.EncyclopediaView({
                application: this,
            });
            this._presenter = new EncyclopediaPresenter.EncyclopediaPresenter(this._view, this._model);

            let provider = new Gtk.CssProvider();
            let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_encyclopedia.css');
            provider.load_from_file(css_file);
            Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(), provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }

        if (this._activation_timestamp !== null) {
            this._view.present_with_time(this._activation_timestamp);
        } else {
            this._view.present();
        }
    },

    vfunc_window_removed: function(win) {
        if (this._view === win) {
            this._view = null;
            this._presenter = null;
        }
        this.parent(win);
    },
});

let app = new EndlessEncyclopedia({
    application_id: ARGV[0] ? ARGV[0] : ENCYCLOPEDIA_APP_ID,
    inactivity_timeout: 12000,
    image_attribution_file: Gio.File.new_for_uri('resource:///com/endlessm/knowledge/credits.json'),
});

app.run(ARGV);
