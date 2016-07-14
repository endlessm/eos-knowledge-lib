imports.gi.versions.WebKit2 = '4.0';

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;

const Actions = imports.app.actions;
const ControllerLoader = imports.app.controllerLoader;
const Dispatcher = imports.app.dispatcher;
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
            this._controller = ControllerLoader.create_controller_with_app_json(this, app_json);
            this._controller.make_ready();
        }
        Dispatcher.get_default().dispatch({
            action_type: Actions.LAUNCHED_FROM_DESKTOP,
            timestamp: Gdk.CURRENT_TIME,
        });
    },
});
