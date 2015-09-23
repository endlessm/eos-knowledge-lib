// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Class: TwoVerticalTemplate
 *
 * Slots:
 *   - top
 *   - bottom
 */
const TwoVerticalTemplate = new Lang.Class({
    Name: 'TwoVerticalTemplate',
    GTypeName: 'EknTwoVerticalTemplate',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.VERTICAL;
        props.expand = true;
        props.halign = Gtk.Align.FILL;
        this.parent(props);

        this.add(this.create_submodule('top'));
        this.add(this.create_submodule('bottom'));
    },
});
