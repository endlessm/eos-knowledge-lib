// Copyright 2015 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Class: BannerTemplate
 * This template has a top banner area, separator, and main content area.
 *
 * Slots
 *   banner
 *   content
 *
 * CSS classes:
 *   separator - on the separator
 */
const BannerTemplate = new Lang.Class({
    Name: 'BannerTemplate',
    GTypeName: 'EknBannerTemplate',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        /**
         * Property: separator-margin
         * How much to indent the separator by on either side
         *
         * Default value:
         *   0
         */
        'separator-margin': GObject.ParamSpec.uint('separator-margin',
            'Separator margin',
            'How much to indent the separator by on either side',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, 0),
        /**
         * Property: image-separator
         * Whether to render the default separator or allow an image
         *
         * Default:
         *   false (default separator)
         */
        'image-separator': GObject.ParamSpec.boolean('image-separator',
            'Image separator',
            'Whether to render the default separator or allow an image',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.VERTICAL;
        props.expand = true;
        this.parent(props);

        let separator_props = {
            margin_start: this.separator_margin,
            margin_end: this.separator_margin,
        };
        let separator;
        if (this.image_separator) {
            separator = new Gtk.Frame(separator_props);
            separator.get_style_context().add_class(Gtk.STYLE_CLASS_SEPARATOR);
        }
        else {
            separator = new Gtk.Separator(separator_props);
        }

        this.add(this.create_submodule('banner'));
        this.add(separator);
        this.add(this.create_submodule('content'));
    },

    get_slot_names: function () {
        return [ 'banner', 'content' ];
    },
});
