const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const WebKit2 = imports.gi.WebKit2;

const Config = imports.config;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

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

    Properties: {
        /**
         * Property: engine
         * Handle to EOS knowledge engine
         *
         * Pass an instance of <Engine> to this property.
         * This is a property for purposes of dependency injection during
         * testing.
         *
         * Flags:
         *   Construct only
         */
        'engine': GObject.ParamSpec.object('engine', 'Engine',
            'Handle to EOS knowledge engine',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
    },

    _init: function (props) {
        props = props || {};
        this._injection_handlers = [];
        props.engine = props.engine || new EosKnowledgeSearch.Engine();
        this.parent(props);

        let settings = this.get_settings();
        settings.enable_developer_extras = Config.inspector_enabled;
        settings.javascript_can_access_clipboard = true;

        this.connect('context-menu', this._load_context_menu.bind(this));
        this.connect('decide-policy', this._onNavigation.bind(this));
        this.web_context.register_uri_scheme('ekn', this._ekn_scheme_handler.bind(this));
    },

    // This handles images embedded in the webview. They
    // will be registered with ekn:// scheme. This handles
    // links with that scheme and instead redirects them to
    // an http request on the correct host and port. Note,
    // article links also have ekn:// scheme, but they are handled
    // by the 'decide-policy' callback function (_onNavigation),
    // and so will not be caught by this function.
    _ekn_scheme_handler: function (req) {
        let [domain, id] = req.get_uri().split('/').slice(-2);
        this.engine.get_ekn_resource_stream(domain, id, function (err, stream) {
            if (err !== undefined) {
                printerr(err);
                printerr(err.stack);
                req.finish_error(err);
            } else {
                req.finish(stream, -1, 'image/*');
            }
        });
    },

    _load_context_menu: function (webview, context_menu, event) {
        context_menu.get_items().forEach(function (item) {
            // Remove all menu items except 'Copy'
            if (item.get_stock_action() !== WebKit2.ContextMenuAction.COPY) {
                context_menu.remove(item);
            }
        });
    },

    /**
     * Method: inject_js_from_resource
     * Injects the given JS file into the current page, as well as all
     * subsequent pages. Note that this will be an asynchronous call, and will
     * not block on the injection/execution of the JS. If you want more control
     * over the order in which JS files are injected, or want to inspect
     * returned results, use <load_js_from_gresource> instead.
     *
     * Parameters:
     *     uri - the JS file's "resource://" URI
     */
    inject_js_from_resource: function (js_uri) {
        let js_str = this._read_gresource_file(js_uri);
        this._run_js_on_loaded_page(js_str, WebKit2.LoadEvent.FINISHED);
    },

    /**
     * Method: inject_css_from_resource
     * Injects the given CSS file into the current page, as well as all
     * subsequent pages
     *
     * Parameters:
     *     uri - the CSS file's "resource://" URI
     */
    inject_css_from_resource: function (css_uri) {
        let css_str = this._read_gresource_file(css_uri);

        // generate a javascript string which creates a CSS Style tag whose
        // innerText is the same as the CSS file in the gresource
        let inject_css_script = [
            'var link = document.createElement("style");',
            'link.type = "text/css";',
            'link.rel = "stylesheet";',
            'var css_text = CSS_TEXT',
            'link.innerText = css_text;',
            'document.getElementsByTagName("head")[0].appendChild(link);'
        ].join('\n').replace('CSS_TEXT', css_str.toSource());

        // exec the javascript
        this._run_js_on_loaded_page(inject_css_script, WebKit2.LoadEvent.COMMITTED);
    },

    /**
     * Method: clear_injections
     * Clear all injection handlers from the webview. All future pages will not
     * be affected by any injected documents prior to calling this.
     */
    clear_injections: function () {
        this._injection_handlers.forEach(function (handler) {
            this.disconnect(handler);
        }.bind(this));
        this._injection_handlers = [];
    },

    // just return the string contents of the file provided by the URI
    _read_gresource_file: function (resource_uri) {
        let file = Gio.file_new_for_uri(resource_uri);
        let [success, resource_str] = file.load_contents(null);
        return resource_str.toString();
    },

    // first, if the webview isn't loading something, attempt to run the
    // javascript on the page. Also attach a handler to run the javascript
    // whenever the webview's load-changed indicates it's finished loading
    // something
    _run_js_on_loaded_page: function (script, event) {
        if (this.uri !== null && !this.is_loading) {
            this.run_javascript(script, null, null);
        }
        let handler = this.connect('load-changed', function (webview, status) {
            if (status == event) {
                this.run_javascript(script, null, null);
            }
        }.bind(this));

        this._injection_handlers.push(handler);
    },

    _onNavigation: function (webview, decision, decision_type) {
        if (decision_type === WebKit2.PolicyDecisionType.NAVIGATION_ACTION) {
            let uri = decision.request.uri;
            let uri_scheme = GLib.uri_parse_scheme(uri);
            if (uri_scheme.startsWith('browser-')) {
                // Open everything that starts with 'browser-' in the system
                // browser
                let realURI = uri.slice('browser-'.length);
                Gtk.show_uri(null, realURI, Gdk.CURRENT_TIME);
                decision.ignore();
                return true; // handled
            } else if (uri_scheme.startsWith('ekn')) {
                // If it starts with 'ekn', convert to a proper http
                // uri and reload with that uri.
                let [domain, id] = uri.split('/').slice(-2);
                let new_uri = this.engine.get_ekn_uri(domain, id);
                this.load_uri(new_uri.to_string(false));
                return true;
            }
        }
        return false; // not handled, default behavior
    }
});
