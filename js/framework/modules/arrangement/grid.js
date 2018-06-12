// Copyright 2015 Endless Mobile, Inc.

/* exported Grid */

const Gtk = imports.gi.Gtk;

const Arrangement = imports.framework.interfaces.arrangement;
const Module = imports.framework.interfaces.module;

/**
 * Class: Grid
 */
var Grid = new Module.Class({
    Name: 'Arrangement.Grid',
    Extends: Gtk.FlowBox,
    Implements: [Arrangement.Arrangement],

    // Arrangement override
    unpack_card: function (card) {
        this.get_children().some(flow_box_child => {
            if (flow_box_child.get_child() === card) {
                this.remove(flow_box_child);
                flow_box_child.remove(card);
                return true;
            }
            return false;
        });
    },

    // Arrangement override
    pack_card: function (card) {
        this.add(card);
    },
});
