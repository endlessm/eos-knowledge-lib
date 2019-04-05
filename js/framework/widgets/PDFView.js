const ByteArray = imports.byteArray;
const { DModel, EosKnowledgePrivate, EvinceDocument, EvinceView, Gdk, GdkPixbuf, GLib, Gio, GObject, Gtk } = imports.gi;
const ShareActionBox = imports.framework.widgets.shareActionBox;
const Knowledge = imports.framework.knowledge;
const Utils = imports.framework.utils;

const THUMB_WIDTH = 58;

/**
 * Class: PDFView
 *
 * The view used to display PDFs in the article page.
 *
 * Makes all the Evince calls necessary to load a PDF. Only exposes one
 * <load_uri> function.
 *
 * Parent class:
 *     Gtk.Box
 */
var PDFView = new Knowledge.Class({
    Name: 'PDFView',
    Extends: Gtk.Box,

    Properties: {
        'model': GObject.ParamSpec.object('model', 'Model',
            'Content object model',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            DModel.Content),

        'show-panel': GObject.ParamSpec.boolean('show-panel',
            'Show panel',
            'Show navigation panel',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            true),

        'show-title': GObject.ParamSpec.boolean('show-title',
            'Show title',
            'Show Title on the panel',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            true),
    },

    Signals: {
        /**
         * Signal: copy
         *
         * Action signal to bind clipboard copy
         */
        'copy': {
            flags: GObject.SignalFlags.ACTION,
        },
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/pdfview.ui',
    InternalChildren: [ 'title_label', 'panel_label', 'iconview', 'liststore',
                        'save', 'print', 'share', 'zoom_in', 'zoom_out',
                        'panel_box', 'share_revealer', 'share_box',
                        'scrolled_window' ],

    _init: function (props) {
        props = props || {};
        props.halign = Gtk.Align.CENTER;
        this.parent(props);

        this._zoom_level = 0;
        this._document_model = new EvinceView.DocumentModel();
        this._view = new EvinceView.View({
            visible: true,
        });
        let actionbox = new ShareActionBox.ShareActionBox ({
            orientation: Gtk.Orientation.VERTICAL,
            pixel_size: 20,
            visible: true,
        });

        Utils.set_hand_cursor_on_widget(this._save);
        Utils.set_hand_cursor_on_widget(this._print);
        Utils.set_hand_cursor_on_widget(this._share);
        Utils.set_hand_cursor_on_widget(this._zoom_in);
        Utils.set_hand_cursor_on_widget(this._zoom_out);

        this._view.set_model(this._document_model);
        this._view.connect('external-link', this.handle_external_link.bind(this));
        this._save.connect('clicked', this._on_save.bind(this));
        this._print.connect('clicked', this._on_print.bind(this));
        this._zoom_in.connect('clicked', () => {
            this._zoom_level++;
            if (this._zoom_level === 0) {
                this._document_model.sizing_mode = EvinceView.SizingMode.FIT_WIDTH;
                return;
            }
            this._document_model.sizing_mode = EvinceView.SizingMode.FREE;
            this._view.zoom_in();
        });
        this._zoom_out.connect('clicked', () => {
            this._zoom_level--;
            if (this._zoom_level === 0) {
                this._document_model.sizing_mode = EvinceView.SizingMode.FIT_WIDTH;
                return;
            }
            this._document_model.sizing_mode = EvinceView.SizingMode.FREE;
            this._view.zoom_out();
        });
        this._share.connect('clicked', () => {
            let reveal = !this._share_revealer.get_reveal_child();
            let ctx = this._share.get_style_context();

            if (reveal) {
                ctx.add_class("inline");
                ctx.remove_class("button");
                this._share_box.get_style_context().add_class('button');
            }
            else {
                ctx.add_class("button");
                ctx.remove_class("inline");
                this._share_box.get_style_context().remove_class('button');
            }

            this._share_revealer.set_reveal_child(reveal);
        });

        this._iconview.connect('item-activated', (iconview, path) => {
            let [retval, iter] = this._liststore.get_iter(path);

            if (retval) {
                let index = this._liststore.get_value(iter, 0);
                this._document_model.set_page(index-1);
            }
        });

        this._document_model.connect('page-changed', (model, old_page, new_page) => {
            let [retval, iter] = this._liststore.iter_nth_child(null, new_page);
            if (retval) {
                let path = this._liststore.get_path(iter);
                this._iconview.select_path(path);
                this._iconview.scroll_to_path(path, false, 0.0, 0.0);
            }
        });

        this._scrolled_window.add(this._view);
        this._share_revealer.add(actionbox);

        this.connect('copy', this._on_copy.bind(this));

        if (this.model) {
            let model = this.model;

            this._panel_label.label = model.title;
            this._title_label.label = model.title;
            this.load_stream (model.get_content_stream(), model.content_type);
            this._share.visible = model.original_uri && model.original_uri.length;
        }

        this._title_label.visible = (this.show_title && !this.show_panel);
        this._panel_label.visible = (this.show_title && this.show_panel);
        this._panel_box.visible = this.show_panel;
    },

    handle_external_link: function (view, link_action) {
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
            relative_to: this._view,
            pointing_to: new Gdk.Rectangle ({
                x: this._view.get_allocated_width()/2,
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
    },

    /**
     *  Method: load_stream
     *
     *  Loads the given stream of a PDF in the view.
     */
    load_stream: function (stream, content_type) {
        this._document = EvinceDocument.Document.factory_get_document_for_stream(
            stream, content_type, EvinceDocument.DocumentLoadFlags.NONE, null);

        this._document_model.set_document(this._document);
        this._document_model.sizing_mode = EvinceView.SizingMode.FIT_WIDTH;
        this._zoom_level = 0;

        this._update_document_actions();

        this._populate_liststore();
    },

    _update_thumb_idle: function () {
        let [retval, iter] = this._liststore.iter_nth_child(null, this._thumb_index);
        let page = this._document.get_page(this._thumb_index);

        if (!retval || !page) {
            this._thumbs_id = 0;
            return GLib.SOURCE_REMOVE;
        }

        /* Calculate thumbnail size */
        let [w, h] = this._document.get_page_size(this._thumb_index);
        let scale = THUMB_WIDTH * 1.0 / w;
        let height = h * scale;

        /* This is undocumented, but without the lock generating the
         * thumbnail might crash the app
         */
        EvinceDocument.Document.doc_mutex_lock();

        /* Generate thumbnail */
        let ctx = EvinceDocument.RenderContext.new(page, 0, scale);
        ctx.set_target_size(THUMB_WIDTH, height);
        let thumb = this._document.get_thumbnail(ctx);
        ctx = null;

        EvinceDocument.Document.doc_mutex_unlock();

        /* Copy thumb content to blank pixbuf, this prevents IconView redraw */
        let pixbuf = this._liststore.get_value(iter, 1);
        thumb.copy_area(0, 0, THUMB_WIDTH, height, pixbuf, 0, 0);

        this._thumb_index++;

        /* Check if more thumbs need to be generated */
        if (this._thumb_index < this._n_pages)
            return GLib.SOURCE_CONTINUE;

        /* We are done generating thumbs, queue a redraw just in case some are
         * still blank
         */
        this._iconview.queue_draw();

        this._thumbs_id = 0;
        return GLib.SOURCE_REMOVE;
    },

    _update_document_actions: function () {
        let model_permissions = {
            print: false,
            export: false
        };
        let document_permissions = {
            print: false,
            export: false
        };

        if (this.model) {
            model_permissions.print = this.model.can_print;
            model_permissions.export = this.model.can_export;
        }

        if (this._document) {
            let document_info = this._document.get_info();
            document_permissions.print = Boolean(document_info.permissions & EvinceDocument.DocumentPermissions.OK_TO_PRINT);
            document_permissions.export = Boolean(document_info.permissions & EvinceDocument.DocumentPermissions.OK_TO_COPY);
        }

        this._ok_to_print = model_permissions.print && document_permissions.print;
        this._ok_to_export = model_permissions.export && document_permissions.export;

        this._print.set_visible(this._ok_to_print);
        this._save.set_visible(this._ok_to_export);
    },

    _populate_liststore: function () {
        if (!this._document)
            return;

        if (this._thumbs_id) {
            GLib.source_remove (this._thumbs_id);
            this._thumbs_id = 0;
        }

        this._thumb_index = 0;
        this._n_pages = this._document.get_n_pages();
        this._liststore.clear();

        /* Populate liststore with page numbers and blank thumb */
        for (let i = 0; i < this._n_pages; i++) {
            let iter = this._liststore.append();
            let label = this._document.get_page_label(i);
            let [w, h] = this._document.get_page_size(i);

            let thumb = GdkPixbuf.Pixbuf.new (
                GdkPixbuf.Colorspace.RGB,
                true,
                8,
                THUMB_WIDTH,
                h * (THUMB_WIDTH/w));

            /* Make it all white */
            thumb.fill(0xffffffff);

            this._liststore.set(iter, [0, 1, 2], [i+1, thumb, label]);
        }

        let [retval, iter] = this._liststore.get_iter_first();
        if (retval) {
            /* Select first icon */
            this._iconview.select_path(this._liststore.get_path(iter));

            /* Queue thumbnail update after half a second */
            this._thumbs_id = GLib.idle_add(GLib.PRIORITY_LOW, this._update_thumb_idle.bind(this));
        }
    },

    _on_print: function () {
        if (!this._document)
            return;

        if (!this._ok_to_print)
            return;

        let job = EvinceView.JobPrint.new(this._document);
        let op = new Gtk.PrintOperation({
            current_page: this._document_model.page,
            n_pages: this._document.get_n_pages(),
            allow_async: true,
        });

        job.connect('finished', () => {
            op.draw_page_finish();
            job.set_cairo(null);
        });

        op.connect('draw-page', (op, ctx, page) => {
            op.set_defer_drawing();
            job.set_page(page);
            job.set_cairo(ctx.get_cairo_context());
            job.scheduler_push_job(EvinceView.JobPriority.PRIORITY_NONE);
        });

        op.run(Gtk.PrintOperationAction.PRINT_DIALOG, this.get_toplevel());
    },

    _on_save: function () {
        if (!this._document)
            return;

        if (!this._ok_to_export)
            return;

        let chooser = new Gtk.FileChooserNative({
            title: 'Save as',
            action: Gtk.FileChooserAction.SAVE,
            do_overwrite_confirmation: true,
            accept_label: '_Save',
            cancel_label: '_Cancel',
        });

        if (this.model && this.model.title)
            chooser.set_current_name(this.model.title + '.pdf');

        if (chooser.run() === Gtk.ResponseType.ACCEPT)
            this._document.save(chooser.get_uri());

        chooser.destroy();
    },

    _on_copy: function () {
        this._view.copy();
    },

    vfunc_get_preferred_width: function () {
        let width = this.get_screen().get_width();
        let [minimal, ] = this.parent();
        return [minimal, width];
    }
});

