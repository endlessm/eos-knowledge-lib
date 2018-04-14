imports.gi.versions.WebKit2 = '4.0';

const {DModel, Endless, EvinceDocument, Gdk, Gio, GLib, GObject, Gtk} = imports.gi;
const Format = imports.format;
const Gettext = imports.gettext;
const System = imports.system;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const HistoryStore = imports.app.historyStore;
const Knowledge = imports.app.knowledge;
const ModuleFactory = imports.app.moduleFactory;
const MoltresEngine = imports.app.moltresEngine;
const NoContentDialog = imports.app.widgets.noContentDialog;
const Pages = imports.app.pages;
const PromiseWrapper = imports.app.promiseWrapper;
const SetMap = imports.app.setMap;
const Utils = imports.app.utils;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

// Initialize libraries
EvinceDocument.init();
// Set up promise wrappers
PromiseWrapper.wrapPromises();

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
const SCSS_COMMAND = 'sassc -a -I ' + Config.TOP_THEME_DIR + ' ';

/**
 * Class: Application
 */
var Application = new Knowledge.Class({
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

        DModel.Engine.get_default().default_app_id = this.application_id;

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
        this.add_main_option('web-overrides-path', 'w'.charCodeAt(), GLib.OptionFlags.NONE, GLib.OptionArg.FILENAME,
                             'Path to a scss or css file to theme any rendered HTML', null);
        this.add_main_option('app-json-path', 'J'.charCodeAt(), GLib.OptionFlags.NONE, GLib.OptionArg.FILENAME,
                             'Path to a yaml or json file to use as a preset', null);
        this.add_main_option('dummy-content', 'm'.charCodeAt(), GLib.OptionFlags.NONE, GLib.OptionArg.NONE,
                             'Whether to use dummy content from Moltres', null);
        this.add_main_option('content-path', 'p'.charCodeAt(), GLib.OptionFlags.NONE, GLib.OptionArg.FILENAME,
                             'Path to the content directory', null);
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

        if (has_option('theme-overrides-path')) {
            if (this._theme) {
                logError(new Error('Both a stock theme and overrides css set, ignoring theme.' + this._theme));
                this._theme = undefined;
            }
            this._overrides_path = get_option_string('theme-overrides-path');
        }
        if (has_option('app-json-path'))
            this._app_json_path = get_option_string('app-json-path');

        if (has_option('dummy-content'))
            MoltresEngine.override_engine();

        if (has_option('content-path')) {
            let engine = DModel.Engine.get_default();
            engine.add_domain_for_path(this.application_id, get_option_string('content-path'));
        }

        if (has_option('web-overrides-path')) {
            this._web_overrides_path = get_option_string('web-overrides-path');
            if (!this._web_overrides_path.endsWith('.scss'))
                this._compiled_web_overrides_path = this._web_overrides_path;
        }

        return -1;
    },

    vfunc_dbus_register: function (connection, path) {
        this.parent(connection, path);
        this._knowledge_search_impl.export(connection, path);
        return true;
    },

    vfunc_dbus_unregister: function (connection, path) {
        this.parent(connection, path);
        if (this._knowledge_search_impl.has_connection(connection))
            this._knowledge_search_impl.unexport_from_connection(connection);
    },

    _remove_legacy_symlinks_from_path: function (path, id) {
        let subscription_dir = GLib.build_filenamev([path, id]);
        let subscription = Gio.File.new_for_path(subscription_dir);
        return PromiseWrapper.wrapPromise(subscription, null,
            'enumerate_children_async', 'standard::*',
            Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, GLib.PRIORITY_LOW)
        .then(enumerator => PromiseWrapper.wrapPromise(enumerator, null,
            'next_files_async', GLib.MAXINT16, GLib.PRIORITY_LOW))
        .then(infos =>
            Promise.all(infos.map(info =>
                PromiseWrapper.wrapPromise(subscription.get_child(info.get_name()),
                    null, 'delete_async', GLib.PRIORITY_LOW))))
        .then(() => PromiseWrapper.wrapPromise(subscription, null,
            'delete_async', GLib.PRIORITY_LOW))
        .catch(err => {
            if (err.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND))
                return;
            logError(err, 'Warning: failed to delete legacy symlinks');
        });
    },

    _remove_legacy_symlinks: function (ids) {
        let home_path = GLib.build_filenamev([GLib.get_home_dir(), '.local',
            'share', 'com.endlessm.subscriptions']);
        let xdg_path = GLib.build_filenamev([GLib.get_user_data_dir(),
            'com.endlessm.subscriptions']);
        ids.forEach(id => {
            this._remove_legacy_symlinks_from_path(home_path, id)
            .then(() => this._remove_legacy_symlinks_from_path(xdg_path, id));
        });
    },

    _initialize_vfs: function () {
        let engine = DModel.Engine.get_default();
        let domain = engine.get_domain();
        let shards = domain.get_shards();
        DModel.default_vfs_set_shards(shards);

        GLib.idle_add(GLib.PRIORITY_LOW, () => {
            this._remove_legacy_symlinks(domain.get_subscription_ids());
            return GLib.SOURCE_REMOVE;
        });
    },

    vfunc_startup: function () {
        this.parent();
        Gtk.IconTheme.get_default().add_resource_path('/com/endlessm/knowledge/data/icons');

        try {
            this._initialize_vfs();
        } catch (e if e.matches(DModel.DomainError, DModel.DomainError.EMPTY)) {
            let dialog = new NoContentDialog.NoContentDialog();
            dialog.run();
        }

        this._initialize_set_map();
    },

    LoadItem: function (id, search_terms, timestamp) {
        this._ensure_controller();
        Dispatcher.get_default().dispatch({
            action_type: Actions.DBUS_LOAD_ITEM_CALLED,
            id,
            search_terms: search_terms,
            timestamp: timestamp,
        });
    },

    LoadQuery: function (search_terms, timestamp) {
        this._ensure_controller();
        Dispatcher.get_default().dispatch({
            action_type: Actions.DBUS_LOAD_QUERY_CALLED,
            search_terms: search_terms,
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

    _initialize_set_map: function () {
        DModel.Engine.get_default().query_promise(new DModel.Query({
            tags_match_all: ['EknSetObject'],
        }))
        .then((results) => {
            SetMap.init_map_with_models(results.models);
        })
        .catch(function (error) {
            logError(error, 'Failed to load sets from database');
        });

        // FIXME: until we can properly await for SetMap to be initialized
        while(Gtk.events_pending())
            Gtk.main_iteration();
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

    get_web_overrides_css: function () {
        if (!this._web_overrides_path)
            return [];
        if (this._compiled_web_overrides_uri)
            return [this._compiled_web_overrides_uri];

        // For now, we don't support gresource URIs here
        let [file] = Gio.File.new_tmp('customXXXXXX.css');
        this._compiled_web_overrides_uri = file.get_uri();
        let command = SCSS_COMMAND + this._web_overrides_path + ' ' +
            file.get_path();
        let [,, stderr, status] = GLib.spawn_command_line_sync(command);
        if (status !== 0) {
            printerr(new Error(command + ': ' + stderr.toString()));
            System.exit(1);
        }
        return [this._compiled_web_overrides_uri];
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
        // Record a content access metric before shutting down
        let history = HistoryStore.get_default();
        let last_item = history.get_current_item();
        if (last_item && last_item.model && last_item.page_type === Pages.ARTICLE)
            Utils.stop_content_access_metric(last_item.model);

        Dispatcher.get_default().pause();
        this.parent();
    },
});
