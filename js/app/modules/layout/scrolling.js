// Copyright 2016 Endless Mobile, Inc.

/* exported Scrolling */

const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const HistoryStore = imports.app.historyStore;

/**
 * Class: Scrolling
 * Layout template that allows its content to scroll vertically
 */
const Scrolling = new Module.Class({
    Name: 'Layout.Scrolling',
    Extends: Gtk.ScrolledWindow,

    Slots: {
        /**
         * Slot: content
         * Where to put the content
         */
        'content': {},
    },

    _init: function (props={}) {
        if (!('vscrollbar_policy' in props))
            props.vscrollbar_policy = Gtk.PolicyType.AUTOMATIC;
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
