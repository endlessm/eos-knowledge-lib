const ByteArray = imports.byteArray;
const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const ArticleHTMLRenderer = imports.app.articleHTMLRenderer;
const ArticleObjectModel = imports.search.articleObjectModel;
const Compat = imports.app.compat.compat;
const Config = imports.app.config;
const Engine = imports.search.engine;
const Utils = imports.app.utils;

/**
 * Class: EknWebview
 * WebKit WebView subclass which provides utility functions for loading
 * and handling content from the knowledge engine and a clean interface
 * for injecting custom JS and CSS from gresource files.
 *
 * Calling <inject_js_from_resource()> or <inject_css_from_resource()> will
 * ensure that the current page (if any) as well as all subsequently loaded
 * pages in this webview will have the given JS or CSS injected only when the
 * HTML document has finished loading
 *
 * CSS classes:
 *   composite - on the <html> element, _browser-side_, if the webview is in a
 *     window on a composite TV screen
 *
 * Parent class:
 *     WebKit2.WebView
 */
const EknWebview = new Lang.Class({
    Name: 'EknWebview',
    GTypeName: 'EknWebview',
    Extends: WebKit2.WebView,

    Properties: {
        /**
         * Property: renderer
         * The <ArticleHTMLRenderer> for rendering article html from a model.
         */
        'renderer': GObject.ParamSpec.object('renderer',
           'Renderer', 'Renderer', GObject.ParamFlags.READABLE,
            ArticleHTMLRenderer.ArticleHTMLRenderer),
    },

    // List of the URL schemes we defer to other applications (e.g. a browser).
    EXTERNALLY_HANDLED_SCHEMES: [
        'http',
        'https',
        'file',
    ],

    _init: function (params) {
        if (!params.user_content_manager)
            params.user_content_manager = new WebKit2.UserContentManager();
        let context = new WebKit2.WebContext();
        params.web_context = context;
        // Need to handle this signal before we make a webview
        context.connect('initialize-web-extensions', () => {
            context.set_web_extensions_directory(Config.WEB_EXTENSION_DIR);
            let well_known_name = new GLib.Variant('s', Utils.get_web_plugin_dbus_name());
            context.set_web_extensions_initialization_user_data(well_known_name);
        });
        context.get_security_manager().register_uri_scheme_as_local('ekn');
        context.register_uri_scheme('ekn', this._load_ekn_uri.bind(this));

        this.parent(params);
        this.renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer();

        let web_settings = this.get_settings();
        web_settings.enable_developer_extras = Config.inspector_enabled;
        web_settings.enable_write_console_messages_to_stdout = true;
        web_settings.javascript_can_access_clipboard = true;

        this._defaultFontSize = web_settings.default_font_size;
        this._defaultMonospaceFontSize = web_settings.default_monospace_font_size;

        let screen = Gdk.Screen.get_default();
        let gtk_settings = Gtk.Settings.get_for_screen(screen);
        this._updateFontSizeFromGtkSettings(gtk_settings);

        this.connect('context-menu', this._load_context_menu.bind(this));
        this.connect('decide-policy', this._onNavigation.bind(this));
        this.connect('query-tooltip', () => {
            GObject.signal_stop_emission_by_name(this, 'query-tooltip');
            return false;
        });
        this.connect('notify::parent', this._check_for_composite.bind(this));
        gtk_settings.connect('notify::gtk-xft-dpi', this._updateFontSizeFromGtkSettings.bind(this));
    },

    _load_context_menu: function (webview, context_menu, event) {
        context_menu.get_items().forEach(function (item) {
            // Remove all menu items except 'Copy'
            let action = item.get_stock_action();
            if (action !== WebKit2.ContextMenuAction.COPY &&
                action !== WebKit2.ContextMenuAction.INSPECT_ELEMENT) {
                context_menu.remove(item);
            }
        });
    },

    _load_ekn_uri: function (req) {
        let fail_with_error = (error) => {
            logError(error);
            req.finish_error(new Gio.IOErrorEnum({
                message: error.message,
                code: 0,
            }));
        };

        try {
            Engine.get_default().get_object_by_id(req.get_uri(),
                                                         null,
                                                        (engine, task) => {
                try {
                    let model = engine.get_object_by_id_finish(task);
                    if (model instanceof ArticleObjectModel.ArticleObjectModel) {
                        let html = this.renderer.render(model);
                        let bytes = ByteArray.fromString(html).toGBytes();
                        let stream = Gio.MemoryInputStream.new_from_bytes(bytes);
                        req.finish(stream, -1, 'text/html; charset=utf-8');
                    } else {
                        let stream = model.get_content_stream();
                        req.finish(stream, -1, null);
                    }
                } catch (error) {
                    fail_with_error(error);
                }
            });
        } catch (error) {
            fail_with_error(error);
        }
    },

    _onNavigation: function (webview, decision, decision_type) {
        if (decision_type === WebKit2.PolicyDecisionType.NAVIGATION_ACTION) {
            let uri = Compat.normalize_old_browser_urls(decision.request.uri);
            let scheme = GLib.uri_parse_scheme(uri);
            if (scheme !== null && this.EXTERNALLY_HANDLED_SCHEMES.indexOf(scheme) !== -1) {
                Gtk.show_uri(null, uri, Gdk.CURRENT_TIME);
                decision.ignore();
                return true; // handled
            }
        }
        return false; // not handled, default behavior
    },

    _updateFontSizeFromGtkSettings: function (gtk_settings) {
        let dpi = gtk_settings.gtk_xft_dpi / 1024;
        let web_settings = this.get_settings();
        web_settings.default_font_size = this._normalizeFontSize(this._defaultFontSize, dpi);
        web_settings.default_monospace_font_size = this._normalizeFontSize(this._defaultMonospaceFontSize, dpi);
    },

    _normalizeFontSize: function (size, dpi) {
        // 96 is the base DPI when no font scaling is applied.
        return size * dpi / 96;
    },

    _check_for_composite: function () {
        if (!this.parent)
            return;
        let screen = this.get_toplevel().screen;
        if (!screen || !Endless.is_composite_tv_screen(screen)) {
            if (this._has_composite_injection_script)
                this.user_content_manager.remove_all_scripts();
            return;
        }

        if (this._has_composite_injection_script)
            return;
        let script = 'document.documentElement.classList.add("' +
            Endless.STYLE_CLASS_COMPOSITE + '");';
        let inject_composite = WebKit2.UserScript.new(script,
            WebKit2.UserContentInjectedFrames.ALL_FRAMES,
            WebKit2.UserScriptInjectionTime.START,
            null, null);
        this.user_content_manager.add_script(inject_composite);
        this._has_composite_injection_script = true;
    },
});
