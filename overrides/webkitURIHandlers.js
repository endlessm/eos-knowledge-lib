const EosKnowledge = imports.gi.EosKnowledge;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const WebKit2 = imports.gi.WebKit2;

function register_webkit_uri_handlers (article_render_callback) {
    let security_manager = WebKit2.WebContext.get_default().get_security_manager();
    security_manager.register_uri_scheme_as_local('ekn');
    EosKnowledge.private_register_global_uri_scheme('ekn', (req) => {
        _load_ekn_assets(req, article_render_callback);
    });
    security_manager.register_uri_scheme_as_local('resource');
    EosKnowledge.private_register_global_uri_scheme('resource', _load_gresource_assets);
}

function _load_ekn_assets (req, article_render_callback) {
    try {
        EosKnowledgeSearch.Engine.get_default().get_object_by_id(req.get_uri(), function (err, model) {
            if (model instanceof EosKnowledgeSearch.ArticleObjectModel) {
                let html = article_render_callback(model);
                let stream = Gio.MemoryInputStream.new_from_data(html, -1, null);
                req.finish(stream, -1, 'text/html; charset=utf-8');
            } else {
                let file = Gio.File.new_for_uri(model.content_uri);
                req.finish(file.read(null), -1, null);
            }
        });
    } catch (error) {
        printerr(error);
        printerr(error.stack);
        req.finish_error(new Gio.IOErrorEnum({ message: error.message, code: 0 }));
    }
}

function _load_gresource_assets (req) {
    try {
        let file = Gio.File.new_for_uri(req.get_uri());
        req.finish(file.read(null), -1, null);
    } catch (error) {
        printerr(error);
        printerr(error.stack);
        req.finish_error(new Gio.IOErrorEnum({ message: error.message, code: 0 }));
    }
}
