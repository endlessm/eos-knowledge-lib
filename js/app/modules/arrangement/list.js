// Copyright 2016 Endless Mobile, Inc.

/* exported List */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const Module = imports.app.interfaces.module;

const List = new Module.Class({
    Name: 'Arrangement.List',
    Extends: Gtk.Grid,
    Implements: [Arrangement.Arrangement],
    Properties: {
        /**
         * Property: max-rows
         * Maximum number of card rows to be displayed
         *
         * A value of zero means no maximum.
         *
         * Default:
         *   0
         */
        'max-rows': GObject.ParamSpec.uint('max-rows', 'Maximum rows',
            'The maximum number of card rows to be displayed.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT16, 0),
        /**
         * Property: homogeneous
         * Whether or not the cards should all be placed in a single size group
         *
         * Default:
         *   true
         */
        'homogeneous': GObject.ParamSpec.boolean('homogeneous', 'Homogeneous',
            'Whether or not the cards should all be placed in a single size group',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            true),
    },

    _init: function (props={}) {
        this.parent(props);
        this._size_group = new Gtk.SizeGroup({
            mode: Gtk.SizeGroupMode.BOTH,
        });
    },

    // Arrangement override
    unpack_card: function (widget) {
        this.remove(widget);
        if (this.homogeneous)
            this._size_group.remove_widget(widget);
    },

    // Arrangement override
    pack_card: function (widget, position=-1) {
        if (this.homogeneous)
            this._size_group.add_widget(widget);
        if (position === -1) {
            this.add(widget);
            return;
        }
        this.insert_row(position);
        this.attach(widget, 0, position, 1, 1);
    },

    get_max_cards: function () {
        return this.max_rows > 0 ? this.max_rows : -1;
    },
});
