// Copyright (C) 2016 Endless Mobile, Inc.

/* exported ListArrangement */

const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const Module = imports.app.interfaces.module;

const ListArrangement = new Module.Class({
    Name: 'ListArrangement',
    CssName: 'EknListArrangement',
    Extends: Gtk.Grid,
    Implements: [Arrangement.Arrangement],

    _init: function (props={}) {
        this.parent(props);
        this._size_group = new Gtk.SizeGroup({
            mode: Gtk.SizeGroupMode.BOTH,
        });
    },

    // Arrangement override
    unpack_card: function (widget) {
        this.remove(widget);
        this._size_group.remove_widget(widget);
    },

    // Arrangement override
    pack_card: function (widget, position=-1) {
        this._size_group.add_widget(widget);
        if (position === -1) {
            this.add(widget);
            return;
        }
        this.insert_row(position);
        this.attach(widget, 0, position, 1, 1);
    },
});
