// Copyright 2015 Endless Mobile, Inc.

/* exported GridArrangement */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;

const GridArrangement = new Lang.Class({
    Name: 'GridArrangement',
    GTypeName: 'EknGridArrangement',
    Extends: InfiniteScrolledWindow.InfiniteScrolledWindow,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'all-visible': GObject.ParamSpec.override('all-visible', Arrangement.Arrangement),
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
        this._real_remove = this.remove;
        this.remove = this.override_remove;
    },

    // Preserve the illusion that the cards are direct children
    override_remove: function (widget) {
        if (widget.get_parent() === this) {
            this._real_remove(widget);
            return;
        }
        this._flow_box.get_children().some(flow_box_child => {
            if (flow_box_child.get_child() === widget) {
                this._flow_box.remove(flow_box_child);
                return true;
            }
            return false;
        });
    },

    // Arrangement implementation
    add_card: function (widget) {
        this._flow_box.add(widget);
    },

    // Arrangement implementation
    get_cards: function () {
        return this._flow_box.get_children().map((flow_child) => flow_child.get_child());
    },

    // Arrangement implementation
    clear: function () {
        let children = this._flow_box.get_children();
        children.forEach((child) => this._flow_box.remove(child));
    },
});
