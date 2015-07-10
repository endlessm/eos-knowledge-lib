imports.gi.versions.WebKit2 = '4.0';

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Config = imports.app.config;
// Register resource
let resource = Gio.Resource.load(Config.PKGDATADIR + '/eos-knowledge.gresource');
resource._register();

const Application = imports.app.application;
const EncyclopediaModel = imports.app.encyclopedia.model;
const EncyclopediaPresenter = imports.app.encyclopedia.presenter;
const EncyclopediaView = imports.app.encyclopedia.view;
const ModuleFactory = imports.app.moduleFactory;
const WebkitContextSetup = imports.app.webkitContextSetup;

const ENCYCLOPEDIA_APP_ID = 'com.endlessm.encyclopedia-en';
const ASSETS_PATH = 'resource:///com/endlessm/knowledge/images/';
const LOGO_FILE = 'logo.svg';

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

    _getLocalizedResource: function(resource_path, filename) {
        let languages = GLib.get_language_names();
        let directories = Gio.resources_enumerate_children(resource_path.split('resource://')[1],
                                                       Gio.ResourceLookupFlags.NONE);
        let location = '';
        // Finds the resource appropriate for the current langauge
        // If can't find language, will return file in C/
        for (let i = 0; i < languages.length; i++) {
            let lang_code = languages[i] + '/';
            if (directories.indexOf(lang_code) !== -1) {
                location = resource_path + lang_code + filename;
                break;
            }
        }
        return location;
    },

    ensure_presenter: function () {
        if (this._presenter !== null)
            return;

        // Load web extensions for translating
        WebkitContextSetup.register_webkit_extensions(this.application_id);

        // Old encyclopedias had no app.json, so we make a fake legacy json with
        // templateType 'encyclopedia', which is handled in our compat layer.
        let factory = new ModuleFactory.ModuleFactory({
            app_json: {
                version: 1,
                templateType: 'encyclopedia',
                titleImageURI: this._getLocalizedResource(ASSETS_PATH, LOGO_FILE),
            },
        });

        this._model = new EncyclopediaModel.EncyclopediaModel();
        this._view = new EncyclopediaView.EncyclopediaView({
            application: this,
            factory: factory,
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
    application_id: ARGV[0] ? ARGV[0] : ENCYCLOPEDIA_APP_ID,
    inactivity_timeout: 12000,
    image_attribution_file: Gio.File.new_for_uri('resource:///com/endlessm/knowledge/credits.json'),
});

app.run(ARGV);
