// Copyright 2015 Endless Mobile, Inc.

const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const Config = imports.app.config;
const StyleClasses = imports.app.styleClasses;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const TYPE_EXTERNAL_LINK = 1;
const TYPE_IN_ISSUE_LINK = 2;
const TYPE_ARCHIVE_LINK = 3;

/**
 * Class: Reader.WebviewTooltip
 * A custom popover widget that can be used to show on top of webview widgets
 */
const WebviewTooltip = new Lang.Class({
    Name: 'WebviewTooltip',
    GTypeName: 'EknReaderWebviewTooltip',
    Extends: Gtk.Popover,
    Properties: {
        /**
         * Property: type
         * An integer with the type of the tooltip

         * Its possible values are enumerated by the constants:
         *  - TYPE_EXTERNAL_LINK
         *  - TYPE_IN_ISSUE_LINK
         *  - TYPE_ARCHIVE_LINK
         *
         * Defaults to TYPE_EXTERNAL_LINK.
         */
        'type': GObject.ParamSpec.uint('type', 'Tooltip Type',
            'Type of the tooltip',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            this.TYPE_EXTERNAL_LINK, this.TYPE_ARCHIVE_LINK, this.TYPE_EXTERNAL_LINK),

        /**
         * Property: title
         * A string with the title of the tooltip
         *
         * Defaults to an empty string.
         */
        'title': GObject.ParamSpec.string('title', 'Title',
            'Title of the tooltip',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),

        /**
         * Property: page-number
         * Page Number of the article within the current set of articles
         *
         * Defaults to 0.
         */
        'page-number': GObject.ParamSpec.uint('page-number', 'Page Number',
            'Page Number of the article within the current set of articles.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, 0),
    },

    _EXTERNAL_LINK_ICON: '/com/endlessm/knowledge/data/images/reader/external-link.svg',
    _ARCHIVE_ICON: 'resource:///com/endlessm/knowledge/data/images/reader/archive.svg',
    _ARCHIVE_ICON_SIZE: 10,

    _init: function (props={}) {
        props.modal = false;
        this.parent(props);

        this._title_label = new Gtk.Label({
            label: this.title,
            ellipsize: Pango.EllipsizeMode.END,
            max_width_chars: 40,
        });

        this.get_style_context().add_class(StyleClasses.READER_WEBVIEW_TOOLTIP);

        switch (this.type) {
            case TYPE_EXTERNAL_LINK:
                this._pack_external_link_tooltip();
                break;
            case TYPE_IN_ISSUE_LINK:
                this._pack_in_issue_link_tooltip();
                break;
            case TYPE_ARCHIVE_LINK:
                this._pack_archive_link_tooltip();
                break;
        }
    },

    _pack_external_link_tooltip: function () {
        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.HORIZONTAL,
            column_spacing: 10,
        });

        let external_link_icon = new Gtk.Image({
            resource: this._EXTERNAL_LINK_ICON,
        });

        grid.add(this._title_label);
        grid.add(external_link_icon);

        this.add(grid);
    },

    _pack_in_issue_link_tooltip: function () {
        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            row_spacing: 6,
        });

        let page_number_label = new Gtk.Label({
            /* TRANSLATORS: This shows the page number; %d will be replaced with
            the page number of the article. */
            label: _("Page %d").format(this.page_number).toLocaleUpperCase(),
        });
        page_number_label.get_style_context().add_class(StyleClasses.READER_TOOLTIP_TYPE_LABEL);

        grid.add(page_number_label);
        grid.add(this._title_label);
        this.add(grid);
    },

    _pack_archive_link_tooltip : function () {
        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            row_spacing: 6,
        });

        let archive_type_label = new Gtk.Label({
            label: _("Archive").toLocaleUpperCase(),
        });
        archive_type_label.get_style_context().add_class(StyleClasses.READER_TOOLTIP_TYPE_LABEL);

        let archive_frame = new Gtk.Frame({
            expand: true,
            visible: false,
            height_request: this._ARCHIVE_ICON_SIZE,
            width_request: this._ARCHIVE_ICON_SIZE,
        });
        let frame_css = '* { background-image: url("' + this._ARCHIVE_ICON + '"); ' +
            'background-size: ' + this._ARCHIVE_ICON_SIZE + 'px ' + this._ARCHIVE_ICON_SIZE + 'px; ' +
            'background-repeat: no-repeat; }';
        let background_provider = new Gtk.CssProvider();
        background_provider.load_from_data(frame_css);
        let context = archive_frame.get_style_context();
        context.add_provider(background_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let type_grid = new Gtk.Grid({
            column_spacing: 4,
            orientation: Gtk.Orientation.HORIZONTAL,
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
        });
        type_grid.add(archive_frame);
        type_grid.add(archive_type_label);

        grid.add(type_grid);
        grid.add(this._title_label);
        this.add(grid);
    },
});
