const ByteArray = imports.byteArray;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const WebKit2 = imports.gi.WebKit2;

const ArticleObjectModel = imports.search.articleObjectModel;
const Engine = imports.search.engine;

function register_webkit_uri_handlers (article_render_callback) {
    let security_manager = WebKit2.WebContext.get_default().get_security_manager();
    security_manager.register_uri_scheme_as_local('ekn');
    EosKnowledge.private_register_global_uri_scheme('ekn', (req) => {
        _load_ekn_assets(req, article_render_callback);
    });
    security_manager.register_uri_scheme_as_local('resource');
    EosKnowledge.private_register_global_uri_scheme('resource', _load_gresource_assets);
}

function _error_request(req, err) {
    printerr(err);
    printerr(err.stack);
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
        Engine.Engine.get_default().get_object_by_id(req.get_uri(), function (err, model) {
            // FIXME: If our webview is gone, or it has moved on to a new page, just return.
            // Might be masking a bug in webkit here. Rushing this fix out for 2.3.
            if (!req.get_web_view() || req.get_web_view().get_uri() !== page_uri)
                return;

            if (err) {
                _error_request(req, err);
                return;
            }

            if (model instanceof ArticleObjectModel.ArticleObjectModel) {
                let html = article_render_callback(model);
                let bytes = ByteArray.fromString(html).toGBytes();
                let stream = Gio.MemoryInputStream.new_from_bytes(bytes);
                req.finish(stream, -1, 'text/html; charset=utf-8');
            } else {
                let stream = model.get_content_stream();
                req.finish(stream, -1, null);
            }
        });
    } catch (error) {
        _error_request(req, error);
    }
}

function _load_gresource_assets (req) {
    try {
        let file = Gio.File.new_for_uri(req.get_uri());
        req.finish(file.read(null), -1, null);
    } catch (error) {
        _error_request(req, error);
    }
}
