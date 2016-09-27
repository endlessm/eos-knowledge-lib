imports.gi.versions.WebKit2 = '4.0';

const Endless = imports.gi.Endless;
const EvinceDocument = imports.gi.EvinceDocument;
const Gdk = imports.gi.Gdk;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const Knowledge = imports.app.knowledge;
const ModuleFactory = imports.app.moduleFactory;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

// Initialize libraries
EvinceDocument.init();

const KnowledgeSearchIface = '\
<node> \
  <interface name="com.endlessm.KnowledgeSearch"> \
    <method name="LoadItem"> \
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

const CREDITS_URI = 'resource:///app/credits.json';
const APP_JSON_URI = 'resource:///app/app.json';
const OVERRIDES_CSS_URI = 'resource:///app/overrides.css';

/**
 * Class: Application
 */
const Application = new Knowledge.Class({
    Name: 'Application',
    Extends: Endless.Application,

    Properties: {
        /**
         * Property: resource-path
         * Path to applications gresource.
         */
        'resource-path': GObject.ParamSpec.string('resource-path',
            'Resource Path', 'Resource Path',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    _init: function (props={}) {
        this.parent(props);
        this._controller = null;
        this._knowledge_search_impl = Gio.DBusExportedObject.wrapJSObject(KnowledgeSearchIface, this);
        this.image_attribution_file = Gio.File.new_for_uri(CREDITS_URI);

        Engine.get_default().default_app_id = this.application_id;

        this.add_main_option('theme-name', 0, GLib.OptionFlags.NONE, GLib.OptionArg.STRING,
                             'Use a stock theme with given name instead of any application theme overrides', null);
        this.add_main_option('default-theme', 0, GLib.OptionFlags.NONE, GLib.OptionArg.NONE,
                             'Same as --theme-name=default', null);
        this.add_main_option('data-path', 0, GLib.OptionFlags.NONE, GLib.OptionArg.FILENAME,
                             'Path to the default data directory for finding content', null);
        this.add_main_option('resource-path', 0, GLib.OptionFlags.NONE, GLib.OptionArg.FILENAME,
                             'Path to a different gresource to use with the application', null);
        this.add_main_option('theme-overrides-path', 0, GLib.OptionFlags.NONE, GLib.OptionArg.FILENAME,
                             'Path to a overrides scss or css file to theme the application', null);
        this.add_main_option('app-json-path', 0, GLib.OptionFlags.NONE, GLib.OptionArg.FILENAME,
                             'Path to a yaml or json file to use as a preset', null);
    },

    vfunc_handle_local_options: function (options) {
        function has_option (option) {
            return options.lookup_value(option, null) !== null;
        }
        function get_option_string (option) {
            return options.lookup_value(option, null).deep_unpack().toString();
        }

        if (has_option('data-path'))
            Engine.get_default().default_data_path = get_option_string('data-path');

        if (has_option('resource-path'))
            this.resource_path = get_option_string('resource-path');
        let app_resource = Gio.Resource.load(this.resource_path);
        app_resource._register();

        if (has_option('default-theme'))
            this._theme = 'default';
        if (has_option('theme-name'))
            this._theme = get_option_string('theme-name');
        if (has_option('default-theme') && has_option('theme-name'))
            logError(new Error('Both --default-theme and --theme-name set; using theme ' + this._theme));

        this._overrides_uri = OVERRIDES_CSS_URI;
        if (has_option('theme-overrides-path'))
            this._overrides_uri = 'file://' + get_option_string('theme-overrides-path');

        this._app_json_uri = APP_JSON_URI;
        if (has_option('app-json-path'))
            this._app_json_uri = 'file://' + get_option_string('app-json-path');

        return -1;
    },

    vfunc_dbus_register: function (connection, path) {
        this.parent(connection, path);
        this._knowledge_search_impl.export(connection, path);
        return true;
    },

    vfunc_dbus_unregister: function (connection, path) {
        this.parent(connection, path);
        this._knowledge_search_impl.unexport_from_connection(connection);
    },

    vfunc_startup: function () {
        this.parent();
        try {
            Engine.get_default().update_and_preload_default_domain();
        } catch (e if e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND)) {
            let dialog = new Gtk.MessageDialog({
                message_type: Gtk.MessageType.ERROR,
                text: _("Oops! No content."),
                secondary_text: _("If you have an internet connection, we are downloading more content right now. Try again in a few minutes after this message disappears."),
                urgency_hint: true,
            });
            dialog.show();
            this._controller = {};  // i.e. don't load the real controller
        }
    },

    LoadItem: function (ekn_id, query, timestamp) {
        this._ensure_controller();
        Dispatcher.get_default().dispatch({
            action_type: Actions.DBUS_LOAD_ITEM_CALLED,
            ekn_id: ekn_id,
            query: query,
            timestamp: timestamp,
        });
    },

    LoadQuery: function (query, timestamp) {
        this._ensure_controller();
        Dispatcher.get_default().dispatch({
            action_type: Actions.DBUS_LOAD_QUERY_CALLED,
            query: query,
            timestamp: timestamp,
        });
    },

    vfunc_activate: function () {
        this.parent();
        this._ensure_controller();
        Dispatcher.get_default().dispatch({
            action_type: Actions.LAUNCHED_FROM_DESKTOP,
            timestamp: Gdk.CURRENT_TIME,
        });
    },

    _ensure_controller: function () {
        if (this._controller === null) {
            let factory = new ModuleFactory.ModuleFactory({
                app_json: JSON.parse(this._get_app_json()),
            });

            let controller_props = {
                application: this,
            };
            if (this._theme)
                controller_props.theme = this._theme;
            else
                controller_props.css = this._get_overrides_css();
            this._controller = factory.create_root_module(controller_props);
            this._controller.make_ready();
        }
    },

    _get_overrides_css: function () {
        try {
            let theme_file = Gio.File.new_for_uri(this._overrides_uri);
            let [, contents] = theme_file.load_contents(null);
            return contents.toString();
        } catch (error if error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND)) {
            // No overrides, fallback to stock theme
            return '';
        }
    },

    _get_app_json: function () {
        let app_json_file = Gio.File.new_for_uri(this._app_json_uri);
        let [, contents] = app_json_file.load_contents(null);
        return contents.toString();
    },

    vfunc_shutdown: function () {
        Dispatcher.get_default().pause();
        this.parent();
    },
});
