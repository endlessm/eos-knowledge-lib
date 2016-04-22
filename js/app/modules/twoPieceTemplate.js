// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Class: TwoPieceTemplate
 * Layout template placing two components next to each other
 *
 * This layout can put two components next to each other (if its **orientation**
 * property is **Gtk.Orientation.HORIZONTAL**) or on top of each other (for
 * **Gtk.Orientation.VERTICAL**).
 *
 * Slots:
 *   - first
 *   - second
 *
 * CSS classes:
 *   first - on the first component
 *   second - on the second component
 */
const TwoPieceTemplate = new Lang.Class({
    Name: 'TwoPieceTemplate',
    GTypeName: 'EknTwoPieceTemplate',
    CssName: 'EknTwoPieceTemplate',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        props.expand = true;
        this.parent(props);

        let first = this.create_submodule('first');
        first.get_style_context().add_class('first');
        this.add(first);

        let second = this.create_submodule('second');
        second.get_style_context().add_class('second');
        this.add(second);
    },

    get_slot_names: function () {
        return ['first', 'second'];
    },
});
