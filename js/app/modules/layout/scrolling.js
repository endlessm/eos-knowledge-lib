// Copyright 2016 Endless Mobile, Inc.

/* exported Scrolling */

const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const HistoryStore = imports.app.historyStore;

/**
 * Class: Scrolling
 * Layout template that allows its content to scroll vertically
 *
 * Slots:
 *   content - where to put the content
 */
const Scrolling = new Module.Class({
    Name: 'Layout.Scrolling',
    Extends: Gtk.ScrolledWindow,

    Slots: {
        'content': {},
    },

    _init: function (props={}) {
        this.parent(props);
        this.add(this.create_submodule('content'));

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
