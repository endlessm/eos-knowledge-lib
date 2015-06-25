imports.gi.versions.WebKit2 = '4.0';

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Application = imports.app.application;
const Config = imports.app.config;
const EncyclopediaModel = imports.app.encyclopedia.model;
const EncyclopediaPresenter = imports.app.encyclopedia.presenter;
const EncyclopediaView = imports.app.encyclopedia.view;
const WebkitContextSetup = imports.app.webkitContextSetup;

const ENCYCLOPEDIA_APP_ID = 'com.endlessm.encyclopedia-en';

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
