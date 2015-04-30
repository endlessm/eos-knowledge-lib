// Copyright 2014 Endless Mobile, Inc.

/* global private_imports */

const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const ImagePreviewer = private_imports.imagePreviewer;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const _LOGO_TOP_MARGIN = 50;
const _LOGO_LEFT_MARGIN = 75;
const _SUBTITLE_LEFT_MARGIN = 125;
const _FRAME_RIGHT_MARGIN = 100;
const _PAGE_WIDTH_THRESHOLD = 1366;
const _EXTRA_MARGIN = 50;
const _MAX_FRAME_WIDTH = 576;

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
         * Property: subtitle
         * A subtitle for the application. Defaults to an empty string.
         */
        'subtitle': GObject.ParamSpec.string('subtitle', 'App subtitle',
            'A subtitle for the app',
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
            halign: Gtk.Align.START,
            margin_top: _LOGO_TOP_MARGIN,
            margin_start: _LOGO_LEFT_MARGIN,
        });

        this._title_image_uri = null;

        let grid = new Gtk.Grid({
            column_homogeneous: true,
            column_spacing: 120,
            orientation: Gtk.Orientation.VERTICAL,
        });

        this._subtitle_label = new Gtk.Label({
            halign: Gtk.Align.START,
            vexpand: true,
            valign: Gtk.Align.START,
            use_markup: true,
            // FIXME: This looks reasonable until we get better instructions
            // from design.
            margin_start: _SUBTITLE_LEFT_MARGIN,
        });

        let snippets_frame = new MaxWidthFrame({
            halign: Gtk.Align.END,
            valign: Gtk.Align.FILL,
            max_width: _MAX_FRAME_WIDTH,
        });
        snippets_frame.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_OVERVIEW_FRAME);

        this._snippets_grid = new EosKnowledge.SpaceContainer({
            orientation: Gtk.Orientation.VERTICAL,
            expand: true,
            halign: Gtk.Align.END,
            valign: Gtk.Align.FILL,
            margin_end: _FRAME_RIGHT_MARGIN,
        });
        snippets_frame.add(this._snippets_grid);

        this.parent(props);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_OVERVIEW_PAGE);
        this._subtitle_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_APP_SUBTITLE);

        grid.attach(this._title_image, 0, 0, 1, 1);
        grid.attach(this._subtitle_label, 0, 1, 1, 1);
        grid.attach(snippets_frame, 1, 0, 1, 2);

        let margin_container = new FlexMarginContainer({
            width_threshold: _PAGE_WIDTH_THRESHOLD,
            extra_margin: _EXTRA_MARGIN,
        });
        margin_container.set_margin_start_children([
            this._title_image,
            this._subtitle_label,
        ]);
        margin_container.set_margin_end_children([
            this._snippets_grid,
        ]);
        margin_container.add(grid);
        this.add(margin_container);
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

    set subtitle (v) {
        if (this._subtitle_label_text === v)
            return;
        this._subtitle_label_text = v;
        /* 758 = 0.74 px * 1024 Pango units / px */
        this._subtitle_label.label = ('<span letter_spacing="758">' +
            GLib.markup_escape_text(this._subtitle_label_text.toLocaleUpperCase(), -1) + '</span>');
        this._subtitle_label.visible = (v && v.length !== 0);
        this.notify('subtitle');
    },

    get subtitle () {
        if (this._subtitle_label_text)
            return this._subtitle_label_text;
        return '';
    },

    /*
      Sets the article snippets on the overview page. Here, a snippet
      is a JS object with two required fields, 'title' and 'synopsis', and one
      optional field, 'style_variant'. This function creates an <ArticleSnippet>
      widget for each snippet model and adds it to the snippets grid.
    */
    set_article_snippets: function (snippets, callback) {
        snippets.forEach((snippet) => {
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

        context.add_class(EosKnowledge.STYLE_CLASS_READER_ARTICLE_SNIPPET);
        this._title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_TITLE);
        this._synopsis_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_SYNOPSIS);

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

/**
 * Class: FlexMarginContainer
 *
 * A custom container that adjusts the horizontal margin of its identified
 * children when the width threshold is crossed.
 */
const FlexMarginContainer = new Lang.Class({
    Name: 'FlexMarginContainer',
    GTypeName: 'EknFlexMarginContainer',
    Extends: Gtk.Bin,
    Properties: {
        'width-threshold': GObject.ParamSpec.uint('width-threshold', 'Width Threshold',
            'Threshold at which the container\'s width should switch from natural margin to minimum margin',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, GLib.MAXUINT32),
        'extra-margin': GObject.ParamSpec.uint('extra-margin', 'Extra margin',
            'Additional margin to alter identified children when width threshold is crossed',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, 0),
    },

    _init: function (props={}) {
        this.parent(props);

        this._width_crossed_threshold = false;
    },

    set_margin_start_children: function (children) {
        this._margin_start_children = children;
    },

    set_margin_end_children: function (children) {
        this._margin_end_children = children;
    },

    _adjust_margins: function (factor) {
        this._margin_start_children.forEach((child) => {
            child.margin_start += factor;
        });

        this._margin_end_children.forEach((child) => {
            child.margin_end += factor;
        });
    },

    vfunc_size_allocate: function (allocation) {
        if (allocation.width < this.width_threshold && !this._width_crossed_threshold) {
            this._width_crossed_threshold = true;
            this._adjust_margins(-1 * this.extra_margin);
        } else if (allocation.width >= this.width_threshold && this._width_crossed_threshold) {
            this._width_crossed_threshold = false;
            this._adjust_margins(this.extra_margin);
        }

        this.parent(allocation);
    },
});

/**
 * Class: MaxWidthFrame
 *
 * A custom frame container that has a hard constraint on its width
 */
const MaxWidthFrame = new Lang.Class({
    Name: 'MaxWidthFrame',
    GTypeName: 'EknMaxWidthFrame',
    Extends: Gtk.Frame,
    Properties: {
        'max-width': GObject.ParamSpec.uint('max-width', 'Maximum Width',
            'Maximum width of the container widget.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, 0),
    },

    _init: function (props={}) {
        this.parent(props);
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        let [min, nat] = this.parent();
        return [Math.min(min, this.max_width), Math.min(nat, this.max_width)];
    },
});
