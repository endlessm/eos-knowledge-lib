const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const Compat = imports.app.compat.compat;
const Config = imports.app.config;

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
 * Parent class:
 *     WebKit2.WebView
 */
const EknWebview = new Lang.Class({
    Name: 'EknWebview',
    GTypeName: 'EknWebview',
    Extends: WebKit2.WebView,

    // List of the URL schemes we defer to other applications (e.g. a browser).
    EXTERNALLY_HANDLED_SCHEMES = [
        'http',
        'https',
        'file',
    ],

    _init: function (params) {
        this.parent(params);

        this._webKitSettings = this.get_settings();
        this._webKitSettings.enable_developer_extras = Config.inspector_enabled;
        this._webKitSettings.enable_write_console_messages_to_stdout = true;
        this._webKitSettings.javascript_can_access_clipboard = true;

        this._defaultFontSize = this._webKitSettings.default_font_size;
        this._defaultMonospaceFontSize = this._webKitSettings.default_monospace_font_size;

        let screen = Gdk.Screen.get_default();
        this._gtkSettings = Gtk.Settings.get_for_screen(screen);
        this._updateFontSizeFromGtkSettings(this._gtkSettings);

        this.connect('context-menu', this._load_context_menu.bind(this));
        this.connect('decide-policy', this._onNavigation.bind(this));
        this._gtkSettings.connect('notify::gtk-xft-dpi', this._updateFontSizeFromGtkSettings.bind(this));
    },

    _load_context_menu: function (webview, context_menu, event) {
        context_menu.get_items().forEach(function (item) {
            // Remove all menu items except 'Copy'
            if (item.get_stock_action() !== WebKit2.ContextMenuAction.COPY) {
                context_menu.remove(item);
            }
        });
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

    _updateFontSizeFromGtkSettings: function (settings) {
        let dpi = settings.gtk_xft_dpi / 1024;
        this._webKitSettings.default_font_size = this._normalizeFontSize(this._defaultFontSize, dpi);
        this._webKitSettings.default_monospace_font_size = this._normalizeFontSize(this._defaultMonospaceFontSize, dpi);
    },

    _normalizeFontSize: function (size, dpi) {
        // 96 is the base DPI when no font scaling is applied.
        return size * dpi / 96;
    }
});
