// Copyright 2015 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const StyleClasses = imports.app.styleClasses;

/**
 * Class: Reader.ArticleSnippet
 * Widget to display an article snippet in the <OverviewPage>
 */
const ArticleSnippet = new Lang.Class({
    Name: 'ArticleSnippet',
    GTypeName: 'EknArticleSnippet',
    Extends: Gtk.Button,
    Properties: {
        /**
         * Property: title
         * A string with the title of the snippet. Defaults to an empty string.
         */
        'title': GObject.ParamSpec.string('title', 'Snippet Title',
            'Title of the snippet',
            GObject.ParamFlags.READWRITE, ''),
        /**
         * Property: synopsis
         * A string with the synopsis of the snippet. Defaults to an empty string.
         */
        'synopsis': GObject.ParamSpec.string('synopsis', 'Snippet Description',
            'synopsis of the snippet',
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
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            -1, GLib.MAXINT16, 0),
    },

    _init: function (props) {
        props = props || {};

        this._title_label = new Gtk.Label({
            hexpand: true,
            halign: Gtk.Align.START,
            xalign: 0,
            ellipsize: Pango.EllipsizeMode.END,
            lines: 4,
            max_width_chars: 40,
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            wrap: true,
        });
        this._synopsis_label = new Gtk.Label({
            hexpand: true,
            halign: Gtk.Align.START,
            xalign: 0,
            ellipsize: Pango.EllipsizeMode.END,
            lines: 2,
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            wrap: true,
        });

        this.parent(props);

        let context = this.get_style_context();

        context.add_class(StyleClasses.READER_ARTICLE_SNIPPET);
        this._title_label.get_style_context().add_class(StyleClasses.READER_TITLE);
        this._synopsis_label.get_style_context().add_class(StyleClasses.READER_SYNOPSIS);

        if (this.style_variant >= 0)
            context.add_class('snippet' + this.style_variant);

        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            expand: true,
        });

        grid.add(this._title_label);
        grid.add(this._synopsis_label);
        this.add(grid);

        this.show_all();
    },

    set title (v) {
        if (this._title_label_text === v)
            return;
        this._title_label_text = v;
        this._title_label.label = this._title_label_text.toUpperCase();
        this._title_label.visible = (v && v.length !== 0);
        this.notify('title');
    },

    get title () {
        if (this._title_label_text)
            return this._title_label_text;
        return '';
    },

    set synopsis (v) {
        if (this._synopsis_label.label === v) return;
        this._synopsis_label.label = v;
        this._synopsis_label.visible = (v && v.length !== 0);
        this.notify('synopsis');
    },

    get synopsis () {
        if (this._synopsis_label)
            return this._synopsis_label.label;
        return '';
    },
});
