// Copyright 2015 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;

const COMPOSITE_REDUCE_MARGINS_FRACTION = 0.4;

/**
 * Class: BannerTemplate
 * This template has a top banner area, separator, and main content area.
 *
 * The left and right margins on this layout template will reduce to 40% of
 * their given values on a composite TV screen.
 *
 * Slots
 *   banner
 *   content
 *
 * CSS classes:
 *   separator - on the separator
 */
const BannerTemplate = new Module.Class({
    Name: 'BannerTemplate',
    GTypeName: 'EknBannerTemplate',
    CssName: 'EknBannerTemplate',
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
    },

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.VERTICAL;
        props.expand = true;
        this.parent(props);

        let separator_props = {
            margin_start: this.separator_margin,
            margin_end: this.separator_margin,
        };
        let separator = new Gtk.Separator(separator_props);
        separator.get_style_context().add_class('banner-separator');

        if (Endless.is_composite_tv_screen(null)) {
            this.margin_start *= COMPOSITE_REDUCE_MARGINS_FRACTION;
            this.margin_end *= COMPOSITE_REDUCE_MARGINS_FRACTION;
        }

        this.add(this.create_submodule('banner'));
        this.add(separator);
        this.add(this.create_submodule('content'));
    },

    get_slot_names: function () {
        return [ 'banner', 'content' ];
    },
});
