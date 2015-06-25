const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Endless = imports.gi.Endless;
const Lang = imports.lang;
const System = imports.system;

imports.gi.versions.WebKit2 = '4.0';

const Engine = imports.search.engine;
const PresenterLoader = imports.app.presenterLoader;
const LegacySearchProvider = imports.search.searchProvider;

if (ARGV.length < 2) {
    printerr("Run this script by passing it an app ID and a gresource file");
    System.exit(1);
}

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

    _init: function (props) {
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
        if (this._presenter.view === win) {
            this._presenter = null;
        }
        this.parent(win);
    },

    _ensure_presenter: function () {
        if (this._presenter === null)
            this._presenter = PresenterLoader.setup_presenter_for_resource(this, ARGV[1]);
    },
});

let app = new Application({
    application_id: ARGV[0],
    inactivity_timeout: 12000,
});
// Gio assumes the first argument of the array is the name of the program being
// invoked. This is standard, but not done in gjs. So we stick ekn-app-runner to
// beginning of our arg list. We remove the two command line arguments handled in
// this script which we do not want to pass on to gapplication default handler.
app.run(['ekn-app-runner'].concat(ARGV.slice(2)));
