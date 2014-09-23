// Copyright 2014 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const CardA = imports.cardA;
const PDF_ICON = '/com/endlessm/knowledge/pdf_icon.png';

/**
 * Class: pdfCard
 *
 * This card represents an article and a PDF icon.
 *
 * Extends:
 *   <CardA>
 */
const PdfCard = new Lang.Class({
    Name: 'PdfCard',
    GTypeName: 'EknPdfCard',
    Extends: CardA.CardA,

    _init: function (props) {
        this.parent(props);
    },

    pack_widgets: function (title_label, synopsis_label, image_frame) {
        this._format_title(title_label);
        this._format_synopsis(synopsis_label);

        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            row_homogeneous : true,
        });

        let pdf_icon = new Gtk.Image({
            resource: PDF_ICON,
        });
        grid.attach(title_label, 0, 0, 2, 1);
        grid.attach(pdf_icon, 0, 1, 1, 1);
        grid.attach(synopsis_label, 1, 1, 1, 1);
        this.add(grid);
    },

    _format_title: function (title_label) {
        title_label.lines = 4;
        title_label.xalign = 0;
    },

    _format_synopsis: function (synopsis_label) {
        synopsis_label.wrap_mode = Pango.WrapMode.WORD;
        synopsis_label.halign = Gtk.Align.START;
        synopsis_label.margin_left = 8;
        this.synopsis = "PDF";
    },
});
