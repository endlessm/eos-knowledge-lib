// Copyright 2015 Endless Mobile, Inc.

/* exported InfiniteScrolling */

const InfiniteScrolledWindow = imports.framework.widgets.infiniteScrolledWindow;
const Module = imports.framework.interfaces.module;
const HistoryStore = imports.framework.historyStore;
const ScrollingIface = imports.framework.interfaces.scrolling;

const _BATCH_SIZE = 10;

/**
 * Class: InfiniteScrolling
 * Layout template that allows its content to scroll vertically
 */
var InfiniteScrolling = new Module.Class({
    Name: 'Layout.InfiniteScrolling',
    Extends: InfiniteScrolledWindow.InfiniteScrolledWindow,
    Implements: [ScrollingIface.Scrolling],

    References: {
        'lazy-load': {},  // type: Selection
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/layout/infiniteScrolling.ui',
    InternalChildren: [ 'viewport' ],

    _init: function (props={}) {
        this.parent(props);

        let content = this.create_submodule('content');

        this._viewport.add(content);

        this.reference_module('lazy-load', selection => {
            this._selection = selection;
            this.connect('need-more-content',
                this._on_need_more_content.bind(this));
            this._selection.connect('models-changed',
                this._on_models_changed.bind(this));
        });
    },

    _on_need_more_content: function () {
        if (this._selection.can_load_more)
            this._selection.queue_load_more(_BATCH_SIZE);
    },

    _on_models_changed: function () {
        if (this._selection.get_models().length > 0)
            this.new_content_added();
    },
});
