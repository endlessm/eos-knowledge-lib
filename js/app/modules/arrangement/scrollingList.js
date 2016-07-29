// Copyright 2016 Endless Mobile, Inc.

/* exported ScrollingList */

const Arrangement = imports.app.interfaces.arrangement;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;

const ScrollingList = new Module.Class({
    Name: 'Arrangement.ScrollingList',
    Extends: InfiniteScrolledWindow.InfiniteScrolledWindow,
    Implements: [Arrangement.Arrangement],

    Template: 'resource:///com/endlessm/knowledge/data/widgets/arrangement/scrollingList.ui',
    InternalChildren: [ 'grid', 'size-group' ],

    _init: function (props={}) {
        this.parent(props);
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
