const ByteArray = imports.byteArray;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const WebKit2 = imports.gi.WebKit2;

const ArticleObjectModel = imports.search.articleObjectModel;
const Config = imports.app.config;
const Engine = imports.search.engine;
const Utils = imports.app.utils;

function register_webkit_uri_handlers (article_render_callback) {
    let security_manager = WebKit2.WebContext.get_default().get_security_manager();
    security_manager.register_uri_scheme_as_local('ekn');
    EosKnowledgePrivate.private_register_global_uri_scheme('ekn', (req) => {
        _load_ekn_assets(req, article_render_callback);
    });
}

function _error_request(req, err) {
    logError(err);
    req.finish_error(new Gio.IOErrorEnum({
        message: err.message,
        code: 0,
    }));
}

function _load_ekn_assets (req, article_render_callback) {
    try {
        // FIXME: If our webview is gone, just return.
        // Might be masking a bug in webkit here. Rushing this fix out for 2.3.
        if (!req.get_web_view())
            return;
        let page_uri = req.get_web_view().get_uri();
        Engine.Engine.get_default().get_object_by_id(req.get_uri(),
                                                     null,
                                                     function (engine, task) {
            // FIXME: If our webview is gone, or it has moved on to a new page, just return.
            // Might be masking a bug in webkit here. Rushing this fix out for 2.3.
            if (!req.get_web_view() || req.get_web_view().get_uri() !== page_uri)
                return;
            try {
                let model = engine.get_object_by_id_finish(task);
                if (model instanceof ArticleObjectModel.ArticleObjectModel) {
                    let html = article_render_callback(model);
                    let bytes = ByteArray.fromString(html).toGBytes();
                    let stream = Gio.MemoryInputStream.new_from_bytes(bytes);
                    req.finish(stream, -1, 'text/html; charset=utf-8');
                } else {
                    let stream = model.get_content_stream();
                    req.finish(stream, -1, null);
                }
            } catch (error) {
                _error_request(req, error);
            }
        });
    } catch (error) {
        _error_request(req, error);
    }
}

function register_webkit_extensions () {
    let web_context = WebKit2.WebContext.get_default();
    web_context.connect('initialize-web-extensions', () => {
        web_context.set_web_extensions_directory(Config.WEB_EXTENSION_DIR);
        let well_known_name = new GLib.Variant('s', Utils.get_web_plugin_dbus_name());
        web_context.set_web_extensions_initialization_user_data(well_known_name);
    });
}
