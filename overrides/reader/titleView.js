// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

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
    },

    _init: function (props) {
        props = props || {};
        props.orientation = Gtk.Orientation.VERTICAL;
        this._title_label = new Gtk.Label({
            wrap: true,
            halign: Gtk.Align.START,
            ellipsize: Pango.EllipsizeMode.END,
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            lines: 3,
            xalign: 0,
        });
        this._attribution_label = new Gtk.Label({
            wrap: true,
            halign: Gtk.Align.START,
            ellipsize: Pango.EllipsizeMode.END,
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            lines: 2,
            xalign: 0,
        });
        this.parent(props);

        this.add(this._title_label);
        this.add(this._attribution_label);

        this._title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_TITLE);
        this._attribution_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_ARTICLE_PAGE_ATTRIBUTION);
    },

    set title(value) {
        if (this._title_label.label === value)
            return;
        this._title_label.label = value;
        this.notify('title');
    },

    get title() {
        if (this._title_label)
            return this._title_label.label;
        return '';
    },

    set attribution(value) {
        if (this._attribution_label.label === value)
            return;
        this._attribution_label.label = value;
        this.notify('attribution');
    },

    get attribution() {
        if (this._attribution_label)
            return this._attribution_label.label;
        return '';
    },
});
