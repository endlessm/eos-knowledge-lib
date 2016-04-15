// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

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
const TwoPieceTemplate = new Module.Class({
    Name: 'TwoPieceTemplate',
    GTypeName: 'EknTwoPieceTemplate',
    CssName: 'EknTwoPieceTemplate',
    Extends: Gtk.Grid,

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
