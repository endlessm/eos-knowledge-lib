// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Class: CardContainer
 * Acts as a grid which contains other cards
 */
const CardContainer = new Lang.Class({
    Name: 'CardContainer',
    GTypeName: 'EknCardContainer',
    Extends: Gtk.Frame,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        /**
         * Property: cards
         * A list of Card objects representing the cards to be displayed on this page.
         * It is set as a normal javascript object since GJS does not support setting
         * objects using ParamSpec.
         */
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/cardContainer.ui',
    InternalChildren: [ 'card-container-grid' ],

    _init: function (props={}) {
        this.parent(props);
    },

    set cards (v) {
        if (this._cards === v)
            return;
        this._cards = v;
        if (this._cards) {
            this.pack_cards(this._cards);
        } else {
            this.pack_cards([]);
        }
    },

    get cards () {
        return this._cards;
    },

    pack_cards: function (cards) {
        let _allowed_card_numbers = [4, 6, 8];
        if (_allowed_card_numbers.indexOf(cards.length) < 0)
            printerr('Should only set 4, 6 or 8 cards in template B. ' + cards.length);

        for (let card of this._card_container_grid.get_children()) {
            this._card_container_grid.remove(card);
        }
        // FIXME: For now we're always showing two rows of cards.
        // An alternative would be to show 1 row for 4 cards, and 2 rows otherwise
        // let columns = this._cards.length === 6 ? 3 : 4;
        let columns = cards.length / 2;
        let i = 0;
        for (let card of cards) {
            let col = i % columns;
            let row = Math.floor(i / columns);
            this._card_container_grid.attach(card, col, row, 1, 1);
            i++;
        }
    },
});
