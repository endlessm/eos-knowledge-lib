imports.gi.versions.WebKit2 = '4.0';

const {DModel, Endless, EvinceDocument, Gdk, Gio, GLib, GObject, Gtk} = imports.gi;
const ByteArray = imports.byteArray;
const Format = imports.format;
const Gettext = imports.gettext;
const System = imports.system;

const Actions = imports.framework.actions;
const Config = imports.framework.config;
const Dispatcher = imports.framework.dispatcher;
const HistoryStore = imports.framework.historyStore;
const Knowledge = imports.framework.knowledge;
const ModuleFactory = imports.framework.moduleFactory;
const MoltresEngine = imports.framework.moltresEngine;
const NoContentDialog = imports.framework.widgets.noContentDialog;
const Pages = imports.framework.pages;
const PromiseWrapper = imports.framework.promiseWrapper;
const SetMap = imports.framework.setMap;
const Utils = imports.framework.utils;

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

const KnowledgeControlIface = `
<node>
  <interface name="com.endlessm.KnowledgeControl">
    <method name="Restart">
      <arg type="a{sh}" name="paths" direction="in"/>
      <arg type="ah" name="gresources" direction="in"/>
      <arg type="ah" name="shards" direction="in"/>
      <arg type="a{sv}" name="options" direction="in"/>
    </method>
  </interface>
</node>
`;

// portal XML taken from flatpak/data/org.freedesktop.portal.Flatpak.xml
// License: LGPLv2
const FlatpakPortalIface = `
<node name="/" xmlns:doc="http://www.freedesktop.org/dbus/1.0/doc.dtd">
  <interface name='org.freedesktop.portal.Flatpak'>
    <property name="version" type="u" access="read"/>
    <method name="Spawn">
      <annotation name="org.gtk.GDBus.C.UnixFD" value="true"/>
      <arg type='ay' name='cwd_path' direction='in'/>
      <arg type='aay' name='argv' direction='in'/>
      <arg type='a{uh}' name='fds' direction='in'/>
      <arg type='a{ss}' name='envs' direction='in'/>
      <arg type='u' name='flags' direction='in'/>
      <arg type="a{sv}" name="options" direction="in"/>
      <arg type='u' name='pid' direction='out'/>
    </method>
    <method name="SpawnSignal">
      <arg type='u' name='pid' direction='in'/>
      <arg type='u' name='signal' direction='in'/>
      <arg type='b' name='to_process_group' direction='in'/>
    </method>
    <signal name="SpawnExited">
      <arg type='u' name='pid' direction='out'/>
      <arg type='u' name='exit_status' direction='out'/>
    </signal>
  </interface>
</node>
`;

const CREDITS_URI = 'resource:///app/credits.json';
const APP_JSON_URI = 'resource:///app/app.json';
const APP_YAML_URI = 'resource:///app/app.yaml';
const OVERRIDES_CSS_URI = 'resource:///app/overrides.css';
const OVERRIDES_SCSS_URI = 'resource:///app/overrides.scss';

const AUTOBAHN_COMMAND = 'autobahn -I ' + Config.YAML_PRESET_DIR + ' ';
const SCSS_COMMAND = 'sassc -a -I ' + Config.TOP_THEME_DIR + ' ';

async function _create_temp_file(basename, fd) {
    const istream = new Gio.UnixInputStream({fd, close_fd: true});

    const datadir = Gio.File.new_for_path(GLib.get_user_data_dir());
    const file = datadir.get_child(basename);
    const ostream = await file.replace_async(null, false,
        Gio.FileCreateFlags.NONE, GLib.PRIORITY_HIGH, null);

    const flags = Gio.OutputStreamSpliceFlags.CLOSE_SOURCE |
        Gio.OutputStreamSpliceFlags.CLOSE_TARGET;
    await ostream.splice_async(istream, flags, GLib.PRIORITY_HIGH, null);

    return file.get_path();
}

async function _determine_restart_args(file_fds, resource_fds, shard_fds, fds) {
    const args = [];

    if ('theme' in file_fds) {
        const path = await _create_temp_file('overrides.css', fds[file_fds.theme]);
        args.push('-O', path);
    }
    if ('webcss' in file_fds) {
        const path = await _create_temp_file('web.css', fds[file_fds.webcss]);
        args.push('-w', path);
    }
    if ('ui' in file_fds) {
        const path = await _create_temp_file('app.json', fds[file_fds.ui]);
        args.push('-J', path);
    }

    await Promise.all(resource_fds.map(async (fd_index, ix) => {
        const path = await _create_temp_file(`extra${ix}.gresource`, fds[fd_index]);
        args.push('-E', path);
    }));

    // Deal with supplementary content. For this, we must have passed in both a
    // manifest.json and shards
    if ('manifest' in file_fds) {
        if (shard_fds.length === 0)
            throw new Error('You must include shards when including a manifest.json');
        await _create_temp_file('manifest.json', fds[file_fds.manifest]);
    }
    await Promise.all(shard_fds.map((fd_index, ix) =>
        _create_temp_file(`content${ix}.shard`, fds[fd_index])));
    if (shard_fds.length > 0) {
        if (!('manifest' in file_fds))
            throw new Error('You must include a manifest.json when including shards');
        args.push('-p', GLib.get_user_data_dir());
    }

    return args;
}

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
        this._knowledge_control_impl =
            Utils.wrap_dbus_implementation_with_fd_list(KnowledgeControlIface, this);
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
        this.add_main_option('extra-resource-path', 'E'.charCodeAt(),
            GLib.OptionFlags.NONE, GLib.OptionArg.FILENAME_ARRAY,
            'Path(s) to extra gresources to use with the application', null);
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
        function register_resource(path) {
            const resource = Gio.Resource.load(path);
            resource._register();
        }

        if (has_option('resource-path'))
            this.resource_path = get_option_string('resource-path');
        register_resource(this.resource_path);

        if (has_option('extra-resource-path')) {
            const extra_resource_paths =
                options.lookup_value('extra-resource-path', null).deep_unpack();
            extra_resource_paths.forEach(bytes =>
                register_resource(bytes.toString()));
        }

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
            if (!this._web_overrides_path.endsWith('.scss')) {
                const uri = Gio.File.new_for_path(this._web_overrides_path).get_uri();
                this._compiled_web_overrides_uri = uri;
            }
        }

        return -1;
    },

    vfunc_dbus_register: function (connection, path) {
        this.parent(connection, path);
        this._knowledge_search_impl.export(connection, path);
        this._knowledge_control_impl.export(connection, path);
        return true;
    },

    vfunc_dbus_unregister: function (connection, path) {
        this.parent(connection, path);
        if (this._knowledge_search_impl.has_connection(connection))
            this._knowledge_search_impl.unexport_from_connection(connection);
        if (this._knowledge_control_impl.has_connection(connection))
            this._knowledge_control_impl.unexport_from_connection(connection);
    },

    _remove_legacy_symlinks_from_path: function (path, id) {
        let subscription_dir = GLib.build_filenamev([path, id]);
        let subscription = Gio.File.new_for_path(subscription_dir);
        const prio = GLib.PRIORITY_LOW;
        return subscription.enumerate_children_async('standard::*',
            Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, prio, null)
        .then(enumerator => enumerator.next_files_async(GLib.MAXINT16, prio, null))
        .then(infos =>
            Promise.all(infos.map(info => {
                const legacy_file = subscription.get_child(info.get_name());
                legacy_file.delete_async(prio, null);
            })))
        .then(() => subscription.delete_async(prio, null))
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
        } catch (e) {
            if (!e.matches(DModel.DomainError, DModel.DomainError.EMPTY))
                throw e;
            let dialog = new NoContentDialog.NoContentDialog();
            dialog.run();
        }

        this._initialize_set_map();

        let screen = Gdk.Screen.get_default();
        Gtk.Settings.get_for_screen(screen).gtk_icon_theme_name = 'EndlessOS';
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

    RestartAsync([file_fds, resource_fds, shard_fds, options], invocation, fdlist) {
        const fds = fdlist.peek_fds();

        _determine_restart_args(file_fds, resource_fds, shard_fds, fds)
        .then(args => this._restart_app(args, options))
        .then(() => {
            invocation.return_value(null);
            this.quit();
        })
        .catch(e => {
            logError(e);
            if (e instanceof GLib.Error) {
                invocation.return_gerror(e);
            } else {
                let {name} = e;
                if (!name.includes('.'))
                    name = `org.gnome.gjs.JSError.${name}`;
                invocation.return_dbus_error(name, e.message);
            }
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

    _restart_app(args, options) {
        const FlatpakPortal = Gio.DBusProxy.makeProxyWrapper(FlatpakPortalIface);
        const portal = new FlatpakPortal(this.get_dbus_connection(),
            'org.freedesktop.portal.Flatpak', '/org/freedesktop/portal/Flatpak');

        const env = {
            // this is not a valid value, but it works well enough to stop the
            // bad value of GIO_USE_VFS that flatpak-portal passes
            GIO_USE_VFS: 'none',
        };
        if ('inspector' in options)
            env.GTK_DEBUG = 'interactive';

        let argv = [this.application_id].concat(args);

        // Work around GJS bug https://gitlab.gnome.org/GNOME/gjs/issues/203
        // Fixed in org.gnome.Platform//3.30. In that version, just pass strings
        // to SpawnSync() instead of byte arrays.
        function zeroTerminatedByteArray(string) {
            const b = ByteArray.fromString(string);
            b[b.length] = 0;
            return b;
        }
        argv = argv.map(zeroTerminatedByteArray);
        const cwd = zeroTerminatedByteArray(GLib.get_current_dir());

        return new Promise((resolve, reject) => {
            portal.SpawnRemote(cwd, argv, [], env, 0, {}, (out, err) => {
                if (err)
                    reject(err);
                else
                    resolve(out);
            });
        });
    },

    _initialize_set_map: function () {
        DModel.Engine.get_default().query(new DModel.Query({
            tags_match_all: ['EknSetObject'],
        }), null)
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
        } catch (e) {
            if (this._overrides_path || !e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND))
                throw e;
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
