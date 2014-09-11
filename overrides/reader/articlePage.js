// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const ProgressLabel = imports.reader.progressLabel;

/**
 * Class: Reader.ArticlePage
 * The article page of the reader app.
 *
 * This page shows an article, title, attribution, and progress label.
 */
const ArticlePage = new Lang.Class({
    Name: 'ArticlePage',
    GTypeName: 'EknReaderArticlePage',
    Extends: Gtk.Grid,
    Properties: {
        /**
         * Property: title
         *
         * A string title of the article being viewed. Defaults to the empty
         * string.
         */
        'title': GObject.ParamSpec.string('title', 'Title',
            'Title of the article',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
        /**
         * Property: attribution
         *
         * A string attribution of the article being viewed. Defaults to the empty
         * string.
         */
        'attribution': GObject.ParamSpec.string('attribution', 'Attribution',
            'Attribution of the article',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
        /**
         * Property: progress-label
         *
         * The <Reader.ProgressLabel> widget created by this widget. Read-only,
         * modify using the progress label API.
         */
        'progress-label': GObject.ParamSpec.object('progress-label', 'Progress Label',
            'The progress indicator at the top of the page',
            GObject.ParamFlags.READABLE,
            ProgressLabel.ProgressLabel.$gtype),
    },

    _init: function (props) {
        props = props || {};
        props.column_homogeneous = true;
        // Keep a minimum width, or the labels get kinda illegible
        props.width_request = 600;

        this._progress_label = new ProgressLabel.ProgressLabel();
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
        this._content_view = null;
        this.parent(props);

        this._inner_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            expand: true,
            valign: Gtk.Align.CENTER,
        });
        this._inner_grid.add(this._title_label);
        this._inner_grid.add(this._attribution_label);

        this.attach(this._progress_label, 0, 0, 2, 1);
        this.attach(this._inner_grid, 0, 1, 1, 1);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE);
        this._title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_TITLE);
        this._attribution_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_ARTICLE_PAGE_ATTRIBUTION);
    },

    set title(v) {
        if (this._title_label.label === v) return;
        this._title_label.label = v;
        this.notify('title');
    },

    get title() {
        if (this._title_label)
            return this._title_label.label;
        return '';
    },

    set attribution(v) {
        if (this._attribution_label.label === v) return;
        this._attribution_label.label = v;
        this.notify('attribution');
    },

    get attribution() {
        if (this._attribution_label)
            return this._attribution_label.label;
        return '';
    },

    get progress_label() {
        return this._progress_label;
    },

    show_content_view: function (view) {
        if (this._content_view !== null) {
            this.remove(this._content_view);
        }
        view.expand = true;
        this._content_view = view;
        this.attach(view, 1, 1, 1, 1);
        view.show_all();
    },
});
