// Copyright 2014 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const SpaceContainer = imports.app.widgets.spaceContainer;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const _LOGO_TOP_MARGIN = 50;
const _LOGO_LEFT_MARGIN = 75;
const _SUBTITLE_LEFT_MARGIN = 125;
const _FRAME_RIGHT_MARGIN = 100;
const _PAGE_WIDTH_THRESHOLD = 1366;
const _MARGIN_DIFF = 50;
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
         * Property: factory
         * Factory to create modules
         */
        'factory': GObject.ParamSpec.object('factory', 'Factory', 'Factory',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),

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

        this._subtitle_label = new Gtk.Label({
            halign: Gtk.Align.START,
            vexpand: true,
            valign: Gtk.Align.START,
            use_markup: true,
            // FIXME: This looks reasonable until we get better instructions
            // from design.
            margin_start: _SUBTITLE_LEFT_MARGIN,
        });

        this.parent(props);

        this._app_banner = this.factory.create_named_module('app-banner', {
            halign: Gtk.Align.START,
            margin_top: _LOGO_TOP_MARGIN,
            margin_start: _LOGO_LEFT_MARGIN,
        });

        let grid = new Gtk.Grid({
            column_homogeneous: true,
            column_spacing: 120,
            orientation: Gtk.Orientation.VERTICAL,
        });

        let snippets_frame = new MaxWidthFrame({
            halign: Gtk.Align.END,
            valign: Gtk.Align.FILL,
            max_width: _MAX_FRAME_WIDTH,
        });
        snippets_frame.get_style_context().add_class(StyleClasses.READER_OVERVIEW_FRAME);

        this._snippets_grid = new SpaceContainer.SpaceContainer({
            orientation: Gtk.Orientation.VERTICAL,
            expand: true,
            halign: Gtk.Align.END,
            valign: Gtk.Align.FILL,
            margin_end: _FRAME_RIGHT_MARGIN,
        });
        snippets_frame.add(this._snippets_grid);

        this.get_style_context().add_class(StyleClasses.READER_OVERVIEW_PAGE);
        this._subtitle_label.get_style_context().add_class(StyleClasses.READER_SUBTITLE);

        grid.connect('size-allocate', (grid, alloc) => {
            if (alloc.width >= _PAGE_WIDTH_THRESHOLD) {
                this._app_banner.margin_start = _LOGO_LEFT_MARGIN;
                this._subtitle_label.margin_start = _SUBTITLE_LEFT_MARGIN;
                this._snippets_grid.margin_end = _FRAME_RIGHT_MARGIN;
            } else {
                this._app_banner.margin_start = _LOGO_LEFT_MARGIN - _MARGIN_DIFF;
                this._subtitle_label.margin_start = _SUBTITLE_LEFT_MARGIN - _MARGIN_DIFF;
                this._snippets_grid.margin_end = _FRAME_RIGHT_MARGIN - _MARGIN_DIFF;
            }
        });

        grid.attach(this._app_banner, 0, 0, 1, 1);
        grid.attach(this._subtitle_label, 0, 1, 1, 1);
        grid.attach(snippets_frame, 1, 0, 1, 2);

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

    set_article_snippets: function (snippets) {
        snippets.forEach((snippet) => {
            this._snippets_grid.add(snippet);
        });
    },

    remove_all_snippets: function () {
        this._snippets_grid.get_children().forEach((child) =>
            this._snippets_grid.remove(child));
    },
});


function get_css_for_module (css_data) {
    let module_data = Utils.get_css_for_submodule('module', css_data);
    return Utils.object_to_css_string(module_data, '.overview-frame');
}

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
