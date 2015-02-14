// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const ImagePreviewer = imports.imagePreviewer;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: Reader.OverviewPage
 * Splash Page shown in the reader when the app opens
 *
 * This page shows the title image of the app, and a series of snippets for
 * some of the articles in the current issue.
 *
 * CSS classes:
 *   overview-page - on the page itself
 */
const OverviewPage = new Lang.Class({
    Name: 'OverviewPage',
    GTypeName: 'EknReaderOverviewPage',
    Extends: Gtk.Frame,
    Properties: {
        /**
         * Property: title-image-uri
         * A URI to the title image. Defaults to an empty string.
         */
        'title-image-uri': GObject.ParamSpec.string('title-image-uri', 'Page Title Image URI',
            'URI to the title image',
            GObject.ParamFlags.READWRITE, ''),
        /**
         * Property: background-image-uri
         *
         * The background image uri for this page.
         * Gets set by the presenter.
         */
        'background-image-uri': GObject.ParamSpec.string('background-image-uri',
            'Background image URI', 'The background image of this page.',
            GObject.ParamFlags.READWRITE, ''),
    },

    _init: function (props) {
        props = props || {};
        props.hexpand = true;

        this._title_image = new ImagePreviewer.ImagePreviewer({
            valign: Gtk.Align.START,
            vexpand: true,
        });

        this._title_image_uri = null;

        let grid = new Gtk.Grid({
            column_homogeneous: true,
            orientation: Gtk.Orientation.VERTICAL,
        });

        this._snippets_grid = new EosKnowledge.SpaceContainer({
            expand: true,
            halign: Gtk.Align.END,
            valign: Gtk.Align.FILL,
        });

        this.parent(props);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_OVERVIEW_PAGE);

        grid.attach(this._title_image, 0, 0, 1, 1);
        grid.attach(this._snippets_grid, 1, 0, 1, 1);

        this.add(grid);
    },

    get background_image_uri () {
        return this._background_image_uri;
    },

    set background_image_uri (v) {
        if (this._background_image_uri === v) return;

        this._background_image_uri = v;
        if (this._background_image_uri !== null) {
            let frame_css = '* { background-image: url("' + this._background_image_uri + '");}';
            let provider = new Gtk.CssProvider();
            provider.load_from_data(frame_css);
            let context = this.get_style_context();
            context.add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }
    },

    set title_image_uri (v) {
        if (this._title_image_uri === v) return;

        this._title_image.file = Gio.File.new_for_uri(v);

        // only actually set the image URI if we successfully set the image
        this._title_image_uri = v;
        this.notify('title-image-uri');
    },

    get title_image_uri () {
        if (this._title_image_uri)
            return this._title_image_uri;
        return '';
    },

    /*
      Sets the article snippets on the overview page. Here, a snippet
      is a JS object with two required fields, 'title' and 'synopsis', and one
      optional field, 'style_variant'. This function creates an <ArticleSnippet>
      widget for each snippet model and adds it to the snippets grid.
    */
    set_article_snippets: function (snippets) {
        snippets.forEach((props) => {
            let snippet = new ArticleSnippet(props);
            this._snippets_grid.add(snippet);
        });
    },

    remove_all_snippets: function () {
        this._snippets_grid.get_children().forEach((child) =>
            this._snippets_grid.remove(child));
    },
});

/**
 * Class: ArticleSnippet
 *
 * Widget to display an article snippet in the <OverviewPage>.
 */
const ArticleSnippet = new Lang.Class({
    Name: 'ArticleSnippet',
    GTypeName: 'EknArticleSnippet',
    Extends: Gtk.Grid,
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
        props.orientation = Gtk.Orientation.VERTICAL;
        props.expand = true;

        this._title_label = new Gtk.Label({
            hexpand: true,
            halign: Gtk.Align.START,
            ellipsize: Pango.EllipsizeMode.END,
            lines: 2,
            max_width_chars: 20,
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            wrap: true,
        });
        this._synopsis_label = new Gtk.Label({
            hexpand: true,
            halign: Gtk.Align.START,
            ellipsize: Pango.EllipsizeMode.END,
            lines: 2,
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            wrap: true,
        });

        this.parent(props);

        let context = this.get_style_context();

        context.add_class(EosKnowledge.STYLE_CLASS_READER_ARTICLE_SNIPPET);
        this._title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_TITLE);
        this._synopsis_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_SYNOPSIS);

        if (this.style_variant >= 0)
            context.add_class('snippet' + this.style_variant);

        this.add(this._title_label);
        this.add(this._synopsis_label);

        this.show_all();
    },

    set title (v) {
        if (this._title_label.label === v) return;
        this._title_label.label = v;
        this._title_label.visible = (v && v.length !== 0);
        this.notify('title');
    },

    get title () {
        if (this._title_label)
            return this._title_label.label;
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
