imports.gi.versions.WebKit2 = '4.0';

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Config = imports.app.config;
// Register resource
let resource = Gio.Resource.load(Config.PKGDATADIR + '/eos-knowledge.gresource');
resource._register();

const Application = imports.app.application;
const EncyclopediaModel = imports.app.encyclopedia.model;
const EncyclopediaPresenter = imports.app.encyclopedia.presenter;
const ModuleFactory = imports.app.moduleFactory;
const WebkitContextSetup = imports.app.webkitContextSetup;
const Utils = imports.app.utils;

const EndlessEncyclopedia = new Lang.Class({
    Name:'EndlessEncyclopedia',
    Extends: Application.Application,

    _init: function (props={}) {
        this.parent(props);
    },

    vfunc_window_removed: function (win) {
        if (this._view === win) {
            this._view = null;
            this._presenter = null;
        }
        this.parent(win);
    },

    ensure_presenter: function () {
        if (this._presenter !== null)
            return;

        // Load web extensions for translating
        WebkitContextSetup.register_webkit_extensions(this.application_id);

        let app_resource = Gio.Resource.load(ARGV[1]);
        app_resource._register();
        let appname = app_resource.enumerate_children('/com/endlessm', Gio.FileQueryInfoFlags.NONE, null)[0];
        let resource_file = Gio.File.new_for_uri('resource:///com/endlessm/' + appname);
        let app_json_file = resource_file.get_child('app.json');
        let app_json = Utils.parse_object_from_file(app_json_file);

        this.image_attribution_file = resource_file.get_child('credits.json');

        let factory = new ModuleFactory.ModuleFactory({
            app_json: app_json,
        });

        this._model = new EncyclopediaModel.EncyclopediaModel();
        this._view = factory.create_named_module('window', {
            application: this,
        });
        this._presenter =
            new EncyclopediaPresenter.EncyclopediaPresenter(this._view, this._model, {
                factory: factory,
            });

        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/css/endless_encyclopedia.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    },
});

let app = new EndlessEncyclopedia({
    application_id: ARGV[0],
    inactivity_timeout: 12000,
});

app.run([]);
