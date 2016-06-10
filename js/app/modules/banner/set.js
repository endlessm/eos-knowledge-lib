// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;

/**
 * Class: Set
 *
 * A module which listens for the set-select action to be dispatched, and
 * creates a card for the selected model.
 *
 * Slots:
 *   card
 */
const Set = new Module.Class({
    Name: 'Banner.Set',
    Extends: Gtk.Frame,

    Slots: {
        'card': {
            multi: true,
        },
    },

    _init: function (props={}) {
        this.parent(props);
        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.SHOW_SET:
                    let child = this.get_child();
                    if (child) {
                        this.remove(child);
                        this.remove_submodule(child);
                    }
                    let card = this.create_submodule('card', {
                        model: payload.model,
                    });
                    // Cards on the banner should not look clickable
                    card.connect('enter-notify-event', function (card) {
                        card.window.set_cursor(null);
                        return Gdk.EVENT_PROPAGATE;
                    });
                    this.add(card);
                    break;
            }
        });
    },
});
