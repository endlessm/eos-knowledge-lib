const {DModel, Endless, Gdk, Gio, GLib, GObject, Gtk, WebKit2, Maxwell} = imports.gi;
const ByteArray = imports.byteArray;

const ArticleHTMLRenderer = imports.framework.articleHTMLRenderer;
const Config = imports.framework.config;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Knowledge = imports.framework.knowledge;
const Utils = imports.framework.utils;

function should_enable_inspector() {
    if (Config.inspector_enabled)
        return true;

    if (GLib.getenv('EKN_ENABLE_INSPECTOR'))
        return true;

    return false;
}

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
 *     Maxwell.WebView
 */
var EknWebview = new Knowledge.Class({
    Name: 'Webview',
    Extends: Maxwell.WebView,

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
        'license',
    ],

    _init: function (params) {
        let context = new WebKit2.WebContext();
        params.web_context = context;

        let application = Gio.Application.get_default();

        // Need to handle this signal before we make a webview
        context.connect('initialize-web-extensions', () => {
            context.set_web_extensions_directory(Config.WEB_EXTENSION_DIR);
            let web_extension_data = new GLib.Variant(
                '(sas)',
                [
                    Utils.get_web_plugin_dbus_name(),
                    application.get_all_resource_paths(),
                ],
            );
            context.set_web_extensions_initialization_user_data(web_extension_data);
        });
        context.get_security_manager().register_uri_scheme_as_local('ekn');
        context.register_uri_scheme('ekn', this._load_ekn_uri.bind(this));

        context.get_security_manager().register_uri_scheme_as_local('ekn+zim');
        context.register_uri_scheme('ekn+zim', this._load_zim_uri.bind(this));

        this.parent(params);
        this.renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer();
        this.renderer.set_custom_css_files(application.get_web_css_overrides());
        this.renderer.set_custom_js_files(application.get_web_js_overrides());

        let web_settings = this.get_settings();
        web_settings.enable_developer_extras = should_enable_inspector();
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
        this.connect('unmap', () => {
            // Destroy License viewer when the view gets hidden
            if (this._license_view) {
                this._license_view.destroy();
                delete this._license_view;
            }
        });
        gtk_settings.connect('notify::gtk-xft-dpi', this._updateFontSizeFromGtkSettings.bind(this));
    },

    _load_context_menu: function (webview, context_menu, event) {
        context_menu.get_items().forEach(function (item) {
            // Remove unwanted menu items
            let action = item.get_stock_action();
            if (action !== WebKit2.ContextMenuAction.COPY &&
                action !== WebKit2.ContextMenuAction.COPY_IMAGE_TO_CLIPBOARD &&
                action !== WebKit2.ContextMenuAction.INSPECT_ELEMENT) {
                context_menu.remove(item);
            }
        });
    },

    _load_object: function (id, memberName) {
        return DModel.Engine.get_default().get_object(id, null)
        .then((model) => {
            if (!memberName) {
                if (model instanceof DModel.Article) {
                    let html = this.renderer.render(model);
                    let stream = Gio.MemoryInputStream.new_from_bytes(
                        ByteArray.fromString(html)
                    );
                    return [stream, 'text/html; charset=utf-8'];
                } else {
                    let stream = model.get_content_stream();
                    return [stream, null];
                }
            } else {
                let stream = model.get_archive_member_content_stream(memberName);
                return [stream, null];
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

        let cancellable = null;

        let id = req.get_uri();

        if (id.startsWith('ekn://')) {
            let components = Utils.components_from_id(id);
            this._load_object(
                `ekn:///${components[0]}`,
                components.length === 1 ? null : components[1],
            ).then(([stream, content_type]) => {
                req.finish(stream, -1, content_type);
            }).catch(function (error) {
                fail_with_error(error);
            });
        } else {
            try {
                let file = Gio.File.new_for_uri(id);
                let stream = file.read(cancellable);
                let info = file.query_info(Gio.FILE_ATTRIBUTE_STANDARD_CONTENT_TYPE, Gio.FileQueryInfoFlags.NONE, cancellable);
                req.finish(stream, -1, info.get_content_type());
            } catch (error) {
                fail_with_error(error);
            }
        }
    },

    _load_zim_uri: function (req) {
        let fail_with_error = (error) => {
            logError(error);
            req.finish_error(new Gio.IOErrorEnum({
                message: error.message,
                code: 0,
            }));
        };

        let id = req.get_uri();

        this._load_object(id)
            .then(([stream, content_type]) => {
                req.finish(stream, -1, content_type);
            })
            .catch(function (error) {
                fail_with_error(error);
            });
    },

    // Tell MathJax to stop any processing; should improve performance when
    // navigating to another page before processing is finished.
    _stop_mathjax: function () {
        this.run_javascript('if (typeof MathJax !== "undefined") MathJax.Hub.queue.Suspend();',
            null, null);
    },

    _onNavigation: function (webview, decision, decision_type) {
        if (decision_type === WebKit2.PolicyDecisionType.NAVIGATION_ACTION) {
            let uri = decision.request.uri;
            let scheme = GLib.uri_parse_scheme(uri);
            if (scheme !== null && this.EXTERNALLY_HANDLED_SCHEMES.indexOf(scheme) !== -1) {
                if (scheme === 'license') {
                    // Create a license viewer
                    if (!this._license_view) {
                        this._license_view = new EosKnowledgePrivate.RuntimeDocumentViewer({
                            transient_for: this.get_toplevel(),
                        });
                        this._license_view.maximize();
                        this._license_view.connect('destroy', () => {
                            this._license_view = null;
                        });
                    }

                    let license = GLib.uri_unescape_string(uri.replace('license://', ''), null);
                    this._license_view.index_uri = Endless.get_license_file(license).get_uri();
                } else {
                    Gtk.show_uri(null, uri, Gdk.CURRENT_TIME);
                }
                decision.ignore();
                return true; // handled
            }
            this._stop_mathjax();
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
    }
});
