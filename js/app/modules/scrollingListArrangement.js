// Copyright 2016 Endless Mobile, Inc.

/* exported ScrollingListArrangement */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;

const ScrollingListArrangement = new Lang.Class({
    Name: 'ScrollingListArrangement',
    GTypeName: 'EknScrollingListArrangement',
    CssName: 'EknScrollingListArrangement',
    Extends: InfiniteScrolledWindow.InfiniteScrolledWindow,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'all-visible': GObject.ParamSpec.override('all-visible', Arrangement.Arrangement),
        'fade-cards': GObject.ParamSpec.override('fade-cards', Arrangement.Arrangement),
        'spacing': GObject.ParamSpec.override('spacing', Arrangement.Arrangement),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/scrollingListArrangement.ui',
    InternalChildren: [ 'grid', 'size-group' ],

    _init: function (props={}) {
        this.parent(props);
        this.bind_property('spacing', this._grid, 'row-spacing',
            GObject.BindingFlags.SYNC_CREATE);
    },

    // Arrangement override
    unpack_card: function (widget) {
        this._grid.remove(widget);
        this._size_group.remove_widget(widget);
    },

    // Arrangement override
    pack_card: function (widget, position=-1) {
        this._size_group.add_widget(widget);
        if (position === -1) {
            this._grid.add(widget);
            return;
        }
        this._grid.insert_row(position);
        this._grid.attach(widget, 0, position, 1, 1);
    },
});
