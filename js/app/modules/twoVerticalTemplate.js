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

        this._top = this.create_submodule('top');
        this._bottom = this.create_submodule('bottom');

        this.add(this._top);
        this.add(this._bottom);
    },

    // FIXME: These getters allow for reaching into the internals
    // of this template, which enables the presenter to connect
    // to widgets lower down in the widget hierarchy, e.g. the
    // search box. We can remove this when the encyclopedia app
    // becomes dispatchified!
    get bottom () {
        return this._bottom;
    },

    get top () {
        return this._top;
    },
});
