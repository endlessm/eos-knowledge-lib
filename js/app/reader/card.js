// Copyright 2015 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gettext = imports.gettext;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const StyleClasses = imports.app.styleClasses;

const EknCard = imports.app.card;
const Config = imports.app.config;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: Reader.ReaderCard
 *
 * A card subclass with sizing and styling specific to Reader Apps.
 *
 * CSS Styles:
 *    reader-card - on the card itself
 *    reader-title - card's label
 *    reader-attribution - card's attribution
 *    reader-card-info-title - card info title
 *    reader-tint-frame - tint frame
 *    reader-card-info-frame - card info frame
 *    reader-card0 - Style variant #0
 *    reader-card1 - Style variant #1
 *    reader-card2 - Style variant #2
 */
const Card = new Lang.Class({
    Name: 'Card',
    GTypeName: 'EknReaderCard',
    Extends: EknCard.Card,
    Properties: {
        /**
         * Property: archived
         */
        'archived': GObject.ParamSpec.boolean('archived', 'Archived',
            'Whether the Reader Card represents an archived article. Defaults to "false"',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, false),

        /**
         * Property: page-number
         */
        'page-number': GObject.ParamSpec.uint('page-number', 'Page Number',
            'Page Number of the article within the current set of articles. Only applies when the card\'s "archived" property is set to "false".',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, 0),

        /**
         * Property: style-variant
         */
        'style-variant': GObject.ParamSpec.uint('style-variant', 'Style Variant',
            'Reader card style variant. Default value is 0.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, 0),
    },

    _CARD_WIDTH: 200,
    _CARD_HEIGHT: 250,
    _CONTENT_MARGIN: 8,
    _DECORATIVE_BAR_HEIGHT: 20,
    _ARCHIVE_ICON: '/com/endlessm/knowledge/images/reader/archive.svg',
    _GRID_COL_SPACING: 4,
    _TITLE_LABEL_LINES: 4,

    _init: function(props={}) {
        this.parent(props);

        this.get_style_context().add_class(StyleClasses.READER_CARD);
    },

    pack_widgets: function (title_label, attribution_label, image_frame) {
        title_label.valign = Gtk.Align.START;

        title_label.get_style_context().add_class(StyleClasses.READER_TITLE);

        title_label.lines = this._TITLE_LABEL_LINES;
        title_label.expand = true;
        title_label.valign = Gtk.Align.CENTER;
        title_label.halign = Gtk.Align.START;
        title_label.max_width_chars = 15;
        title_label.margin = this._CONTENT_MARGIN;

        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            expand: true,
            halign: Gtk.Align.FILL,
            valign: Gtk.Align.FILL,
        });

        let decorative_bar = new Gtk.Frame({
            hexpand: true,
            halign: Gtk.Align.FILL,
            height_request: this._DECORATIVE_BAR_HEIGHT,
            margin_start: this._CONTENT_MARGIN,
            margin_end: this._CONTENT_MARGIN,
        });
        decorative_bar.get_style_context().add_class(StyleClasses.READER_DECORATIVE_BAR);

        grid.add(decorative_bar);
        grid.add(title_label);

        let card_info_grid = new Gtk.Grid({
            column_spacing: this._GRID_COL_SPACING,
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
            orientation: Gtk.Orientation.HORIZONTAL,
            visible: true,
        });

        let card_info_label = new Gtk.Label({
            hexpand: false,
            vexpand: false,
            use_markup: true,
            visible: true,
        });
        card_info_label.get_style_context().add_class(StyleClasses.READER_CARD_INFO_TITLE);

        if (this.archived) {
            let archive_icon = new Gtk.Image({
                resource: this._ARCHIVE_ICON,
                visible: true,
            });

            card_info_label.label = _("Archive");
            card_info_grid.add(archive_icon);
        } else {
            card_info_label.label = (_("Page %s").format('<b>' + this.page_number + '</b>'));
        }
        card_info_grid.add(card_info_label);

        let card_info_frame = new Gtk.Frame({
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
            visible: true,
        });
        card_info_frame.get_style_context().add_class(StyleClasses.READER_CARD_INFO_FRAME);

        card_info_frame.add(card_info_grid);

        let hover_frame = new Gtk.Frame({
            expand: true,
            halign: Gtk.Align.FILL,
            valign: Gtk.Align.FILL,
            no_show_all: true,
            visible: false,
        });
        hover_frame.get_style_context().add_class(StyleClasses.READER_HOVER_FRAME);

        this.connect('enter-notify-event', () => {
            hover_frame.show();
        });

        this.connect('leave-notify-event', () => {
            hover_frame.hide();
        });

        hover_frame.add(card_info_frame);

        let overlay = new Gtk.Overlay();
        overlay.add(grid);
        overlay.add_overlay(hover_frame);
        overlay.set_overlay_pass_through(hover_frame, true);
        this.add(overlay);
    },

    get style_variant () {
        return this._style_variant;
    },

    set style_variant (v) {
        if (this._style_variant === v) return;

        // Remove style variant classes.
        let style_variants = [
            'reader-card0',
            'reader-card1',
            'reader-card2',
        ];
        style_variants.map((style_variant_class) => {
            this.get_style_context().remove_class(style_variant_class);
        });

        this.get_style_context().add_class('reader-card' + v);
        this._style_variant = v;
        this.notify('style-variant');
    },

    // TODO: we do want all cards to be the same size, but we may want to make
    // this size scale with resolution down the road
    vfunc_get_preferred_width: function () {
        return [this._CARD_WIDTH, this._CARD_WIDTH];
    },

    vfunc_get_preferred_height: function () {
        return [this._CARD_HEIGHT, this._CARD_HEIGHT];
    },
});
