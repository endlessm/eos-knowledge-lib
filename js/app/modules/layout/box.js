// Copyright 2016 Endless Mobile, Inc.

/* exported Box */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;

/**
 * Class: Box
 * Layout widget that places an arbitrary number components next to each other
 *
 * This layout can put an arbitrary number of components in a sequence. If its
 * **orientation** property is **Gtk.Orientation.HORIZONTAL**, the components
 * are placed next to each other. If the **orientation** property is
 * **Gtk.Orientation.VERTICAL**, the components are placed one below the other.
 */
var Box = new Module.Class({
    Name: 'Layout.Box',
    Extends: Gtk.Grid,

    Properties: {
        /**
         * Property: homogeneous
         * Whether all cells have the same size in their main dimension
         *
         * When this property is set to TRUE and the orientation is set to
         * **Gtk.Orientation.HORIZONTAL**, all cells will have the same width.
         * When this property is set to TRUE and the orientation is set to
         * **Gtk.Orientation.VERTICAL**, all cells will have the same height.
         *
         * Default:
         *   FALSE
         */
        'homogeneous': GObject.ParamSpec.boolean('homogeneous', 'Homogeneous',
            'Whether all cells have the same size in their main dimension',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    Slots: {
        'contents': {
            array: true,
            requires: [
                Gtk.Widget,
            ],
        },
    },

    _init: function (props={}) {
        this.parent(props);

        this.row_homogeneous = this.homogeneous;
        this.column_homogeneous = this.homogeneous;

        // An array of submodules is expected
        this._contents = this.create_submodule('contents');
        this._contents.forEach(item => this.add(item));
    },
});
