// Copyright 2016 Endless Mobile, Inc.

/* exported PaginatedScrolling */
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const HistoryStore = imports.app.historyStore;

const Utils = imports.app.utils;

const _BATCH_SIZE = 10;

/**
 * Class: PaginatedScrolling
 * Layout template that allows its content to scroll vertically.
 * More content is added when user hits the 'see more' button.
 *
 * Slots:
 *   content - where to put the content
 */
const PaginatedScrolling = new Module.Class({
    Name: 'Layout.PaginatedScrolling',
    Extends: Gtk.ScrolledWindow,

    Slots: {
        'content': {},
    },
    References: {
        'paginated-load': {},  // type: Selection
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/layout/paginatedScrolling.ui',
    InternalChildren: [ 'grid', 'see-more-button' ],

    _init: function (props={}) {
        this.parent(props);

        let content = this.create_submodule('content');
        this._grid.attach(content, 0, 0, 1, 1);
        Utils.set_hand_cursor_on_widget(this._see_more_button);

        this.reference_module('paginated-load', selection => {
            this._selection = selection;
            if (this._selection) {
                this._see_more_button.connect('clicked',
                    this._on_need_more_content.bind(this));
                this._selection.connect('notify::can-load-more', () => {
                    this._see_more_button.visible = this._selection.can_load_more;
                });
            }
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
});
