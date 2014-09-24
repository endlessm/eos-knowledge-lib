const EosKnowledge = imports.gi.EosKnowledge;
const EvinceDocument = imports.gi.EvinceDocument;
const EvinceView = imports.gi.EvinceView;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

/**
 * Class: PDFView
 *
 * The view used to display PDFs in the article page.
 *
 * Makes all the Evince calls necessary to load a PDF. Only exposes one
 * <load_uri> function.
 *
 * Parent class:
 *     Gtk.ScrolledWindow
 */
const PDFView = new Lang.Class({
    Name: 'PDFView',
    GTypeName: 'EknPDFView',
    Extends: Gtk.ScrolledWindow,

    _init: function (props) {
        this.parent(props);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_PDF_VIEW);
    },

    /**
     *  Method: load_uri
     *
     *  Loads the given uri of a PDF in the view.
     */
    load_uri: function (uri) {
        let evince_document = EvinceDocument.Document.factory_get_document(
            uri, EvinceDocument.DocumentLoadFlags.NONE, null);
        let document_model = new EvinceView.DocumentModel({
            document: evince_document,
        });
        let view = new EvinceView.View();
        view.set_model(document_model);
        view.show_all();

        let child = this.get_child();
        if (child !== null)
            this.remove(child);
        this.add(view);
    },
});
