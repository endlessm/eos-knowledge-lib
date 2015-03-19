// Copyright 2015 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

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
         * Property: title
         * A string with the title of the tooltip
         *
         * Defaults to an empty string.
         */
        'title': GObject.ParamSpec.string('title', 'Title',
            'Title of the tooltip',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    _EXTERNAL_LINK_ICON: '/com/endlessm/knowledge/reader/external-link.svg',

    _init: function (props={}) {
        props.modal = false;
        this.parent(props);

        this._title_label = new Gtk.Label({
            label: this.title,
            ellipsize: Pango.EllipsizeMode.END,
            max_width_chars: 40,
        });

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_WEBVIEW_TOOLTIP);

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
});
