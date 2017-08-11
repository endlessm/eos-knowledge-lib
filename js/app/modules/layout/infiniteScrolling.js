// Copyright 2015 Endless Mobile, Inc.

/* exported InfiniteScrolling */

const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;
const HistoryStore = imports.app.historyStore;

const _BATCH_SIZE = 10;

/**
 * Class: InfiniteScrolling
 * Layout template that allows its content to scroll vertically
 */
var InfiniteScrolling = new Module.Class({
    Name: 'Layout.InfiniteScrolling',
    Extends: InfiniteScrolledWindow.InfiniteScrolledWindow,

    Slots: {
        /**
         * Slot: content
         * Where to put the content
         */
        'content': {},
    },
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

        HistoryStore.get_default().connect('changed', this._return_to_top.bind(this));
    },

    // return scroll position to the top of the window
    _return_to_top: function () {
        let lower = this.vadjustment.get_lower();
        if (this.vadjustment.get_value() !== lower) {
            this.vadjustment.set_value(lower);
        }
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
