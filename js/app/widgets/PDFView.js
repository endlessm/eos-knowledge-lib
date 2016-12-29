const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const EvinceDocument = imports.gi.EvinceDocument;
const EvinceView = imports.gi.EvinceView;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Knowledge = imports.app.knowledge;

const _MAX_PDF_VIEW_WIDTH = 1300;

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
const PDFView = new Knowledge.Class({
    Name: 'PDFView',
    Extends: Gtk.ScrolledWindow,

    _init: function (props) {
        props = props || {};
        props.halign = Gtk.Align.CENTER;
        this.parent(props);
    },

    /**
     *  Method: load_stream
     *
     *  Loads the given stream of a PDF in the view.
     */
    load_stream: function (stream, content_type) {
        let evince_document = EvinceDocument.Document.factory_get_document_for_stream(
            stream, content_type, EvinceDocument.DocumentLoadFlags.NONE, null);
        let document_model = new EvinceView.DocumentModel({
            document: evince_document,
        });
        let view = new EvinceView.View({
            visible: true,
        });
        view.set_model(document_model);
        view.connect('external-link', (view, link_action) => {
            if (link_action.type !== EvinceDocument.LinkActionType.EXTERNAL_URI)
                return;

            let [content_type, uncertain] = Gio.content_type_guess (link_action.uri, null);

            if (GLib.uri_parse_scheme (link_action.uri) !== 'file' ||
                !GLib.str_has_prefix (content_type, 'audio')) {
                Gtk.show_uri(null, link_action.uri, Gdk.CURRENT_TIME);
                return;
            }

            let mediabin = new EosKnowledgePrivate.MediaBin({
                audioMode: true,
                uri: link_action.uri,
            });
            mediabin.show();

            let popover = new Gtk.Popover({
                relative_to: this,
                pointing_to: new Gdk.Rectangle ({
                    x: this.get_allocated_width()/2,
                    y: 0,
                    width: 1,
                    height: 1,
                })
            });

            popover.add (mediabin);

            popover.connect('closed', () => {
                mediabin.stop();
                popover.remove(mediabin);
            });

            /* Show popup */
            popover.popup();

            /* Start playback */
            mediabin.play();
        });

        let child = this.get_child();
        if (child !== null)
            this.remove(child);
        this.add(view);
    },

    vfunc_get_preferred_width: function () {
        let [minimal, natural] = this.parent();
        return [Math.min(minimal, _MAX_PDF_VIEW_WIDTH), _MAX_PDF_VIEW_WIDTH];
    }
});

