imports.gi.versions.WebKit2 = '4.0';

const Eknc = imports.gi.EosKnowledgeContent;
const Endless = imports.gi.Endless;
const EvinceDocument = imports.gi.EvinceDocument;
const Format = imports.format;
const Gdk = imports.gi.Gdk;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const System = imports.system;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const Downloader = imports.search.downloader;
const Knowledge = imports.app.knowledge;
const ModuleFactory = imports.app.moduleFactory;
const MoltresEngine = imports.search.moltresEngine;

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
const APP_YAML_URI = 'resource:///app/app.yaml';
const OVERRIDES_CSS_URI = 'resource:///app/overrides.css';
const OVERRIDES_SCSS_URI = 'resource:///app/overrides.scss';

const AUTOBAHN_COMMAND = 'autobahn -I ' + Config.YAML_PRESET_DIR + ' ';
const SCSS_COMMAND = 'scss --compass -E utf-8 --stop-on-error --sourcemap=none -I ' + Config.TOP_THEME_DIR + ' ';

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

        Eknc.Engine.get_default().default_app_id = this.application_id;

        this.add_main_option('theme-name', 't'.charCodeAt(), GLib.OptionFlags.NONE, GLib.OptionArg.STRING,
                             'Use a stock theme with given name instead of any application theme overrides', null);
        this.add_main_option('default-theme', 'd'.charCodeAt(), GLib.OptionFlags.NONE, GLib.OptionArg.NONE,
                             'Same as --theme-name=default', null);
        this.add_main_option('recompile-theme-overrides', 'o'.charCodeAt(), GLib.OptionFlags.NONE, GLib.OptionArg.NONE,
                             'Recompile the applications overrides.css file from the source scss', null);
        this.add_main_option('recompile-app-json', 'j'.charCodeAt(), GLib.OptionFlags.NONE, GLib.OptionArg.NONE,
                             'Recompile the app json file from the source yaml', null);
        this.add_main_option('recompile-all', 'r'.charCodeAt(), GLib.OptionFlags.NONE, GLib.OptionArg.NONE,
                             'Same as --recompile-overrides --recompile-app-json', null);
        this.add_main_option('resource-path', 'R'.charCodeAt(), GLib.OptionFlags.NONE, GLib.OptionArg.FILENAME,
                             'Path to a different gresource to use with the application', null);
        this.add_main_option('theme-overrides-path', 'O'.charCodeAt(), GLib.OptionFlags.NONE, GLib.OptionArg.FILENAME,
                             'Path to a overrides scss or css file to theme the application', null);
        this.add_main_option('app-json-path', 'J'.charCodeAt(), GLib.OptionFlags.NONE, GLib.OptionArg.FILENAME,
                             'Path to a yaml or json file to use as a preset', null);
        this.add_main_option('dummy-content', 'C'.charCodeAt(), GLib.OptionFlags.NONE, GLib.OptionArg.NONE,
                             'Whether to use dummy content from Moltres', null);
    },

    vfunc_handle_local_options: function (options) {
        function has_option (option) {
            return options.lookup_value(option, null) !== null;
        }
        function get_option_string (option) {
            return options.lookup_value(option, null).deep_unpack().toString();
        }

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

        this._recompile_overrides = has_option('recompile-all') || has_option('recompile-theme-overrides');
        this._recompile_app_json = has_option('recompile-all') || has_option('recompile-app-json');

        if (has_option('theme-overrides-path'))
            this._overrides_path = get_option_string('theme-overrides-path');
        if (has_option('app-json-path'))
            this._app_json_path = get_option_string('app-json-path');

        if (has_option('dummy-content'))
            MoltresEngine.override_engine();

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

    _check_for_content: function () {
        let engine = Eknc.Engine.get_default();
        if (engine instanceof MoltresEngine.MoltresEngine)
            return;

        this._check_for_update();
        try {
            let shards = engine.get_domain().get_shards();
            Eknc.default_vfs_set_shards(shards);
        } catch (e if e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND)) {
            // No content. If updates are pending then show a nice dialog
            let subs = engine.get_domain().get_subscription_entries();
            if (subs.some(entry => !entry.disable_updates)) {
                let dialog = new Gtk.MessageDialog({
                    message_type: Gtk.MessageType.ERROR,
                    text: _("Oops! No content."),
                    secondary_text: _("If you have an internet connection, we are downloading more content right now. Try again in a few minutes after this message disappears."),
                    urgency_hint: true,
                });
                dialog.show();
                this._controller = {};  // i.e. don't load the real controller
            }
            // if no updates pending, then proceed and let Xapian queries fail
        }
    },

    _check_for_update: function () {
        if (GLib.getenv('EKN_DISABLE_UPDATES'))
            return;

        let engine = Eknc.Engine.get_default();
        let downloader = Downloader.get_default();
        let subs = engine.get_domain().get_subscription_entries();
        subs.forEach(function (entry) {
            let id = entry.id;

            if (entry.disable_updates)
                return;

            // Synchronously apply any update we have.
            downloader.apply_update(id, null, (downloader, result) => {
                downloader.apply_update_finish(result);

                // Regardless of whether or not we applied an update,
                // let's see about fetching a new one...
                downloader.fetch_update(id, null, (downloader, result) => {
                    try {
                        downloader.fetch_update_finish(result);
                    } catch(e) {
                        logError(e, Format.vprintf("Could not update subscription ID: %s", [id]));
                    }
                });
            });
        });
    },

    vfunc_startup: function () {
        this.parent();
        this._check_for_content();
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
        let contents, theme_file;
        if (this._overrides_path)
            theme_file = Gio.File.new_for_path(this._overrides_path);
        else
            theme_file = Gio.File.new_for_uri(this._recompile_overrides ? OVERRIDES_SCSS_URI : OVERRIDES_CSS_URI);
        try {
            [, contents] = theme_file.load_contents(null);
            contents = contents.toString();
        } catch (error if !this._overrides_path && error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND)) {
            // No overrides, fallback to stock theme
            return '';
        }
        if (!theme_file.get_uri().endsWith('.scss'))
            return contents;
        // This uri might be a gresource, and the scss command cannot read
        // from a gresource, so save the file contents to a tmp file.
        [theme_file,] = Gio.File.new_tmp(null);
        theme_file.replace_contents(contents, null, false, 0, null);
        let [, stdout, stderr, status] = GLib.spawn_command_line_sync(SCSS_COMMAND + theme_file.get_path());
        if (status !== 0) {
            printerr(new Error(stderr.toString()));
            System.exit(1);
        }
        return stdout.toString();
    },

    _get_app_json: function () {
        let contents, app_json_file;
        if (this._app_json_path)
            app_json_file = Gio.File.new_for_path(this._app_json_path);
        else
            app_json_file = Gio.File.new_for_uri(this._recompile_app_json ? APP_YAML_URI : APP_JSON_URI);
        [, contents] = app_json_file.load_contents(null);
        contents = contents.toString();
        if (!app_json_file.get_uri().endsWith('.yaml'))
            return contents;
        // This uri might be a gresource, and the autobahn command cannot read
        // from a gresource, so save the file contents to a tmp file.
        [app_json_file,] = Gio.File.new_tmp(null);
        app_json_file.replace_contents(contents, null, false, 0, null);
        let [, stdout, stderr, status] = GLib.spawn_command_line_sync(AUTOBAHN_COMMAND + app_json_file.get_path());
        if (status !== 0) {
            printerr(new Error(stderr.toString()));
            System.exit(1);
        }
        return stdout.toString();
    },

    vfunc_shutdown: function () {
        Dispatcher.get_default().pause();
        this.parent();
    },
});
