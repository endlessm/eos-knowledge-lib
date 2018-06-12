// Copyright 2015 Endless Mobile, Inc.

/* exported TiledGrid */

const Gtk = imports.gi.Gtk;

const Arrangement = imports.framework.interfaces.arrangement;
const Module = imports.framework.interfaces.module;

var TiledGrid = new Module.Class({
    Name: 'Arrangement.TiledGrid',
    Extends: Gtk.Grid,
    Implements: [Arrangement.Arrangement],

    _init: function (props={}) {
        this.parent(props);
    },

    // Arrangement override
    fade_card_in: function (card) {
        card.show_all();
    },

    // Arrangement override
    pack_card: function () {
        // FIXME: For now we're always showing two rows of cards.
        // An alternative would be to show 1 row for 4 cards, and 2 rows otherwise
        this.get_children().forEach(child => this.remove(child));
        // The card to be packed is already in this array:
        let cards = this.get_cards();
        let count = this.get_card_count();
        let columns = count < 4 ? count : Math.ceil(count / 2);
        let i = 0;
        for (let card of cards) {
            let col = i % columns;
            let row = Math.floor(i / columns);
            this.attach(card, col, row, 1, 1);
            i++;
        }
    },
});
