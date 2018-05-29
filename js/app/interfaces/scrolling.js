// Copyright 2018 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;

/**
 * Interface: Scrolling
 */
var Scrolling = new Lang.Interface({
    Name: 'Scrolling',
    GTypeName: 'EknScrolling',
    Requires: [Gtk.ScrolledWindow, Module.Module],

    Slots: {
        /**
         * Slot: content
         * Where to put the content
         */
        'content': {
            requires: [
                Gtk.Widget,
            ],
        },
    },

    _interface_init() {
        HistoryStore.get_default().connect('changed', this._return_to_top.bind(this));
    },

    // return scroll position to the top of the window
    _return_to_top() {
        let store = HistoryStore.get_default();
        let current = store.get_current_item();
        let previous = store.get_direction() === HistoryStore.Direction.FORWARDS ?
            store.get_previous_item() : store.get_next_item();

        // if switching from, to or within a lightbox, then don't reset
        if ((current && current.media_model) || (previous && previous.media_model)) {
            return;
        }

        let lower = this.vadjustment.get_lower();
        if (this.vadjustment.get_value() !== lower) {
            this.vadjustment.set_value(lower);
        }
    },
});
