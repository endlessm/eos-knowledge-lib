// Copyright 2015 Endless Mobile, Inc.

/* exported InfiniteScrolling */

const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;
const HistoryStore = imports.app.historyStore;

/**
 * Class: InfiniteScrolling
 * Layout template that allows its content to scroll vertically
 *
 * Slots:
 *   content - where to put the content
 */
const InfiniteScrolling = new Module.Class({
    Name: 'Layout.InfiniteScrolling',
    Extends: InfiniteScrolledWindow.InfiniteScrolledWindow,

    Slots: {
        'content': {},
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/layout/infiniteScrolling.ui',
    InternalChildren: [ 'viewport' ],

    _init: function (props={}) {
        this.parent(props);

        let content = this.create_submodule('content');

        this._viewport.add(content);

        HistoryStore.get_default().connect('changed', this._return_to_top.bind(this));
    },

    // return scroll position to the top of the window
    _return_to_top: function () {
        let lower = this.vadjustment.get_lower();
        if (this.vadjustment.get_value() !== lower) {
            this.vadjustment.set_value(lower);
        }
    },
});
