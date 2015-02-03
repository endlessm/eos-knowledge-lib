const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const Config = imports.config;

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

    _init: function (params) {
        this.parent(params);

        let settings = this.get_settings();
        settings.enable_developer_extras = Config.inspector_enabled;
        settings.javascript_can_access_clipboard = true;

        this.connect('context-menu', this._load_context_menu.bind(this));
        this.connect('decide-policy', this._onNavigation.bind(this));
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
            let uri = decision.request.uri;
            let scheme = GLib.uri_parse_scheme(uri);
            if (scheme !== null && scheme.startsWith('browser-')) {
                // Open everything that starts with 'browser-' in the system
                // browser
                let realURI = uri.slice('browser-'.length);
                Gtk.show_uri(null, realURI, Gdk.CURRENT_TIME);
                decision.ignore();
                return true; // handled
            }
        }
        return false; // not handled, default behavior
    }
});
