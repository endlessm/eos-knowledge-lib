// Copyright 2015 Endless Mobile, Inc.

/* exported Arrangement */

const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

/**
 * Interface: Arrangement
 * Arrangement and order of cards in a container
 *
 * An arrangement controls how a group of cards are presented in the UI.
 * Examples of arrangements: a list, a grid, etc.
 */
const Arrangement = new Lang.Interface({
    Name: 'Arrangement',
    GTypeName: 'EknArrangement',
    Requires: [ Gtk.Widget, Module.Module ],

    /**
     * Method: add_card
     * Add a card to the arrangement
     *
     * Parameters:
     *   card - a <Card> implementation
     */
    add_card: Lang.Interface.UNIMPLEMENTED,

    /**
     * Method: get_cards
     * Get all cards in the arrangement
     */
    get_cards: Lang.Interface.UNIMPLEMENTED,

    get_max_cards: function () {
        return -1;
    },

    /**
     * Method: clear
     * Remove all cards from the arrangement
     */
    clear: Lang.Interface.UNIMPLEMENTED,

    highlight: function (model) {
        this.clear_highlight();
        for (let card of this.get_cards()) {
            if (card.model.ekn_id === model.ekn_id) {
                card.get_style_context().add_class(StyleClasses.HIGHLIGHTED);
                return;
            }
        }
    },

    clear_highlight: function() {
        for (let card of this.get_cards()) {
            card.get_style_context().remove_class(StyleClasses.HIGHLIGHTED);
        }
    },
});
