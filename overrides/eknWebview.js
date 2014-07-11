const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit = imports.gi.WebKit2;

const Endless = imports.gi.Endless;

/**
 * Class: EknWebview
 * WebKit WebView subclass which provides utility functions for loading
 * and handling content from the knowledge engine.
 *
 * Parent class:
 *     Endless.InjectableWebview
 */
const EknWebview = new Lang.Class({
    Name: 'EknWebview',
    GTypeName: 'EknWebview',
    Extends: Endless.InjectableWebview,

    _init: function (params) {
        this.parent(params);

        this.connect('decide-policy', this._onNavigation.bind(this));
    },

    _onNavigation: function (webview, decision, decision_type) {
	    if (decision_type === WebKit.PolicyDecisionType.NAVIGATION_ACTION) {
	        let uri = decision.request.uri;
	        if (GLib.uri_parse_scheme(uri).startsWith('browser-')) {
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
