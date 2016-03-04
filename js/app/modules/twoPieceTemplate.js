// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Class: TwoPieceTemplate
 *
 * Slots:
 *   - first
 *   - second
 */
const TwoPieceTemplate = new Lang.Class({
    Name: 'TwoPieceTemplate',
    GTypeName: 'EknTwoPieceTemplate',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        props.expand = true;
        this.parent(props);

        this.add(this.create_submodule('first'));
        this.add(this.create_submodule('second'));
    },

    get_slot_names: function () {
        return ['first', 'second'];
    },
});
