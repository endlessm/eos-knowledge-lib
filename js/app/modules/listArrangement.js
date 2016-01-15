// Copyright 2015 Endless Mobile, Inc.

/* exported ListArrangement */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;

const ListArrangement = new Lang.Class({
    Name: 'ListArrangement',
    GTypeName: 'EknListArrangement',
    Extends: InfiniteScrolledWindow.InfiniteScrolledWindow,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'all-visible': GObject.ParamSpec.override('all-visible', Arrangement.Arrangement),
        'spacing': GObject.ParamSpec.override('spacing', Arrangement.Arrangement),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/listArrangement.ui',
    InternalChildren: [ 'grid', 'size-group' ],

    _init: function (props={}) {
        this.parent(props);
        this.bind_property('spacing', this._grid, 'row-spacing',
            GObject.BindingFlags.SYNC_CREATE);
    },

    add_card: function (widget) {
        this._grid.add(widget);
        this._size_group.add_widget(widget);
    },

    get_cards: function () {
        return this._grid.get_children();
    },

    clear: function () {
        this._grid.get_children().forEach((child) => {
            this._grid.remove(child);
        });
        this._size_group.get_widgets().forEach((widget) => {
            this._size_group.remove_widget(widget);
        });
    },
});
