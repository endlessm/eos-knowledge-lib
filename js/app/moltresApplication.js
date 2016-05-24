imports.gi.versions.WebKit2 = '4.0';

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;

const ControllerLoader = imports.app.controllerLoader;
const Knowledge = imports.app.knowledge;
const MoltresEngine = imports.search.moltresEngine;
const Utils = imports.app.utils;

/**
 * Class: MoltresApplication
 *
 * A trimmed down application class for running test app.json files
 */
const MoltresApplication = new Knowledge.Class({
    Name: 'MoltresApplication',
    Extends: Endless.Application,

    Properties: {
        /**
         * Property: app-json-path
         * Path to applications app.json file.
         */
        'app-json-path': GObject.ParamSpec.string('app-json-path',
            'App JSON Path', 'App JSON Path',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    _init: function (props={}) {
        this.parent(props);
        this._controller = null;
    },

    vfunc_activate: function () {
        this.parent();
        if (this._controller === null) {
            let app_json = Utils.parse_object_from_file(Gio.File.new_for_path(this.app_json_path));

            MoltresEngine.override_engine();
            // FIXME: The entire endless_knowledge theme is its 'custom css'.
            // This will be fixed once we figure out theming for v2 apps.
            let css_file = Gio.File.new_for_path('data/css/default.css');
            let [success, data] = css_file.load_contents(null);
            let css = data.toString();
            this._controller = ControllerLoader.create_controller_with_app_json(this, app_json, {
                css: css,
            });
        }
        this._controller.desktop_launch(Gdk.CURRENT_TIME);
    },
});
