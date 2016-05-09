// Copyright 2015 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;

const COMPOSITE_REDUCE_MARGINS_FRACTION = 0.4;

/**
 * Class: Banner
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
const Banner = new Module.Class({
    Name: 'BannerTemplate',
    CssName: 'EknBannerTemplate',
    Extends: Gtk.Grid,

    Slots: {
        'banner': {},
        'content': {},
    },

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.VERTICAL;
        props.expand = true;
        this.parent(props);

        let separator = new Gtk.Separator({
            visible: true,
        });
        separator.get_style_context().add_class('banner-separator');

        if (Endless.is_composite_tv_screen(null)) {
            this.margin_start *= COMPOSITE_REDUCE_MARGINS_FRACTION;
            this.margin_end *= COMPOSITE_REDUCE_MARGINS_FRACTION;
        }

        this.add(this.create_submodule('banner'));
        this.add(separator);
        this.add(this.create_submodule('content'));
    },
});
