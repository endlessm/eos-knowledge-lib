// Copyright 2015 Endless Mobile, Inc.

/* exported GridArrangement */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;

/**
 * Class: GridArrangement
 */
const GridArrangement = new Lang.Class({
    Name: 'GridArrangement',
    GTypeName: 'EknGridArrangement',
    Extends: InfiniteScrolledWindow.InfiniteScrolledWindow,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'all-visible': GObject.ParamSpec.override('all-visible', Arrangement.Arrangement),
        'fade-cards': GObject.ParamSpec.override('fade-cards', Arrangement.Arrangement),
        'spacing': GObject.ParamSpec.override('spacing', Arrangement.Arrangement),
        /**
         * Property: max-children-per-line
         *
         * The maximum amount of children to request space for consecutively
         * in the given orientation.
         */
        'max-children-per-line':  GObject.ParamSpec.int('max-children-per-line', 'Max children per line',
            'The number of children to show in each line of the flow box',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXINT32, 7),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/gridArrangement.ui',
    InternalChildren: [ 'flow_box' ],

    _init: function (props={}) {
        this.parent(props);
        this.bind_property('max-children-per-line',
            this._flow_box, 'max-children-per-line',
            GObject.BindingFlags.SYNC_CREATE);
        this.bind_property('spacing', this._flow_box, 'column-spacing',
            GObject.BindingFlags.SYNC_CREATE);
        this.bind_property('spacing', this._flow_box, 'row-spacing',
            GObject.BindingFlags.SYNC_CREATE);

        let order = this.get_order();
        if (order) {
            this._flow_box.set_sort_func((child1, child2) =>
                order.compare(child1.get_child().model, child2.get_child().model));
        }

        let filter = this.get_filter();
        if (filter) {
            this._flow_box.set_filter_func(child =>
                filter.include(child.get_child().model));
        }
    },

    // Arrangement override
    unpack_card: function (card) {
        this._flow_box.get_children().some(flow_box_child => {
            if (flow_box_child.get_child() === card) {
                this._flow_box.remove(flow_box_child);
                return true;
            }
            return false;
        });
    },

    // Arrangement override
    pack_card: function (card) {
        this._flow_box.add(card);
    },
});
