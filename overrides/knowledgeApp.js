const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Endless = imports.gi.Endless;
const Lang = imports.lang;

const Presenter = imports.presenter;

const ENDLESS_PREFIX = '/com/endlessm/';

const KnowledgeApp = new Lang.Class ({
    Name: 'KnowledgeApp',
    GTypeName: 'EknKnowledgeApp',
    Extends: Endless.Application,

    _init: function(props, gresource_filename){
        this.parent(props);
        this._gresource_filename = gresource_filename;
    },

    vfunc_startup: function() {
        this.parent();
        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_knowledge.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                 provider,
                                                 Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        // Load and register the GResource which has content for this app
        let resource = Gio.Resource.load(this._gresource_filename);
        resource._register();

        // Parse the appname and personality from the gresource
        let appname = resource.enumerate_children(ENDLESS_PREFIX, Gio.FileQueryInfoFlags.NONE, null)[0];
        let app_resource_uri = 'resource://' + ENDLESS_PREFIX + appname;
        let app_json_file_uri = app_resource_uri + 'app.json';

        let overrides_css_file = Gio.File.new_for_uri(app_resource_uri + 'overrides.css');
        let overrides_provider = new Gtk.CssProvider();
        overrides_provider.load_from_file(overrides_css_file);
        // Add overrides with one step higher priority than the default
        // knowledge app CSS
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            overrides_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION + 1);

        let presenter = new Presenter.Presenter(this, app_json_file_uri);
    }
});
