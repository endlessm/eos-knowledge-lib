// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const _TITLE_LABEL_BOTTOM_MARGIN_PX = 50;
const _ORNAMENT_WIDTH_PX = 34;
const _ORNAMENT_HEIGHT_PX = 2;
const _ORNAMENT_MARGIN_RIGHT_PX = 22;

/**
 * Class: Reader.TitleView
 * Widget displaying the title and author of an article
 *
 * This displays the title and attribution information for an article.
 */
const TitleView = new Lang.Class({
    Name: 'TitleView',
    GTypeName: 'EknTitleView',
    Extends: Gtk.Grid,
    Properties: {
        /**
         * Property: title
         *
         * A string title of the article being viewed.
         * Defaults to the empty string.
         */
        'title': GObject.ParamSpec.string('title', 'Title',
            'Title of the article',
            GObject.ParamFlags.READWRITE, ''),
        /**
         * Property: attribution
         *
         * A string attribution of the article being viewed.
         * Defaults to the empty string.
         */
        'attribution': GObject.ParamSpec.string('attribution', 'Attribution',
            'Attribution of the article',
            GObject.ParamFlags.READWRITE, ''),
        /**
         * Property: style-variant
         * Which style variant to use for appearance
         *
         * Which CSS style variant to use (default is zero.)
         * If the variant does not exist then the snippet will have only the
         * styles common to all variants.
         * Use -1 as a variant that is guaranteed not to exist.
         */
        'style-variant': GObject.ParamSpec.int('style-variant', 'Style variant',
            'Which CSS style variant to use for appearance',
            GObject.ParamFlags.READWRITE,
            -1, GLib.MAXINT16, 0),
    },

    _init: function (props) {
        this._style_variant = 0;
        this._title_label = new Gtk.Label({
            wrap: true,
            halign: Gtk.Align.START,
            ellipsize: Pango.EllipsizeMode.END,
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            lines: 5,
            xalign: 0,
            use_markup: true,
            margin_bottom: _TITLE_LABEL_BOTTOM_MARGIN_PX,
        });
        this._attribution_label = new Gtk.Label({
            wrap: true,
            expand: true,
            valign: Gtk.Align.BASELINE,
            halign: Gtk.Align.START,
            ellipsize: Pango.EllipsizeMode.END,
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            lines: 2,
            xalign: 0,
            use_markup: true,
        });
        this.parent(props);

        this._ornament = new Gtk.Frame({
            width_request: _ORNAMENT_WIDTH_PX,
            height_request: _ORNAMENT_HEIGHT_PX,
            expand: false,
            valign: Gtk.Align.END,
            halign: Gtk.Align.CENTER,
            margin_right: _ORNAMENT_MARGIN_RIGHT_PX,
            no_show_all: true,
        });

        this.attach(this._title_label, 0, 0, 2, 1);
        this.attach(this._ornament, 0, 1, 1, 1);
        this.attach(this._attribution_label, 1, 1, 1, 1);

        this._ornament.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_ARTICLE_PAGE_ORNAMENT);
        this._title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_TITLE);
        this._attribution_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_ARTICLE_PAGE_ATTRIBUTION);
    },

    set title(value) {
        if (this._title_text === value)
            return;
        this._title_text = value;
        this._title_label.label = GLib.markup_escape_text(this._title_text.toLocaleUpperCase(), -1);
        this.notify('title');
    },

    get title() {
        if (this._title_text)
            return this._title_text;
        return '';
    },

    set attribution(value) {
        if (this._attribution_text === value)
            return;
        this._attribution_text = value;
        this._update_attribution();
        this.notify('attribution');
    },

    get attribution() {
        if (this._attribution_text)
            return this._attribution_text;
        return '';
    },

    get style_variant() {
        return this._style_variant;
    },

    set style_variant(value) {
        if (this._style_variant === value)
            return;
        this._style_variant = value;
        this._update_attribution();
        this.notify('style-variant');
    },

    _update_attribution: function () {
        let markup_label = this._attribution_text;

        // Apply styling that currently isn't possible with CSS. Ideally this
        // should be done with the following CSS code:
        //     .article-page1 .article-page-attribution {
        //         text-transform: uppercase;
        //         letter-spacing: 1.33px;
        //     }
        //     .article-page2 .article-page-attribution {
        //         text-transform: uppercase;
        //     }
        // However, those properties are not currently supported in GTK CSS.
        if (this.style_variant === 1 || this.style_variant === 2)
            markup_label = markup_label.toLocaleUpperCase();
        if (this.style_variant === 1)
            markup_label = '<span letter_spacing="1362">' + GLib.markup_escape_text(markup_label, -1) + '</span>';
        // 1362 = 1.33px * 1024 Pango units/px

        this._attribution_label.label = markup_label;

        // Only show the ornament if there's any text for it to decorate
        this._ornament.visible = (typeof this._attribution_text !== 'undefined' && this._attribution_text.length > 0);
    },
});
