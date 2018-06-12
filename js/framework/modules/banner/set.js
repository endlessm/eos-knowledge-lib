// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const HistoryStore = imports.framework.historyStore;
const Module = imports.framework.interfaces.module;
const Pages = imports.framework.pages;

/**
 * Class: Set
 *
 * A banner which shows a card for the model currently being displayed on the
 * set page.
 */
var Set = new Module.Class({
    Name: 'Banner.Set',
    Extends: Gtk.Frame,

    Slots: {
        'card': {
            multi: true,
        },
    },

    _init: function (props={}) {
        this.parent(props);
        this._set_model = null;
        HistoryStore.get_default().connect('changed',
            this._on_history_changed.bind(this));
    },

    _on_history_changed: function (history) {
        let item = history.search_backwards(0,
            item => item.page_type === Pages.SET);
        if (!item)
            return;

        let child = this.get_child();
        if (child) {
            if (item.model === child.model)
                return;
            this.remove(child);
            this.drop_submodule(child);
        }

        let card = this.create_submodule('card', {
            model: item.model,
        });
        // Cards on the banner should not look clickable
        card.connect('enter-notify-event', (card) => {
            card.window.set_cursor(null);
            return Gdk.EVENT_PROPAGATE;
        });
        this.add(card);
    },
});
