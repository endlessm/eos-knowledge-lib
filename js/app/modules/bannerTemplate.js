// Copyright 2015 Endless Mobile, Inc.

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
 */
const BannerTemplate = new Lang.Class({
    Name: 'BannerTemplate',
    GTypeName: 'EknBannerTemplate',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.VERTICAL;
        props.expand = true;
        this.parent(props);

        let banner = this.create_submodule('banner', {
            halign: Gtk.Align.CENTER,
        });
        let content = this.create_submodule('content');
        let separator = new Gtk.Separator({
            margin_start: 100,
            margin_end: 100,
        });

        this.add(banner);
        this.add(separator);
        this.add(content);
    },

    get_slot_names: function () {
        return [ 'banner', 'content' ];
    },
});
