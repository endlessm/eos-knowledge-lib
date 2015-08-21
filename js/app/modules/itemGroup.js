// Copyright 2015 Endless Mobile, Inc.

/* exported ItemGroup */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ContentObjectModel = imports.search.contentObjectModel;
const Module = imports.app.interfaces.module;

/**
 * Class: ItemGroup
 * Acts as a grid which contains other cards
 *
 * Slots:
 *   arrangement
 *   card_type
 */
const ItemGroup = new Lang.Class({
    Name: 'ItemGroup',
    GTypeName: 'EknItemGroup',
    Extends: Gtk.Frame,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },
    Signals: {
        /**
         * Event: article-selected
         * Indicates that a card was clicked in the search results
         *
         * FIXME: This signal is temporary, and the dispatcher will make it
         * unnecessary.
         *
         * Parameters:
         *   <ContentObjectModel> - the model of the card that was clicked
         */
        'article-selected': {
            param_types: [ ContentObjectModel.ContentObjectModel ],
        },
    },

    _init: function (props={}) {
        this.parent(props);
        this.pack_module_for_slot('arrangement');
    },

    // Module override
    get_slot_names: function () {
        return ['arrangement', 'card_type'];
    },

    /**
     * Method: set_cards
     * Display some cards
     *
     * Parameters:
     *   cards - an array of <ContentObjectModels>
     */
    set_cards: function (cards) {
        this._arrangement.clear();
        this.append_cards(cards);
    },

    /**
     * Method: append_cards
     * Add some cards to the already existing cards
     *
     * Like <ItemGroup.set_cards>, but will add the cards without removing the
     * existing ones and thereby disturbing the UI.
     *
     * Parameters:
     *   cards - an array of <ContentObjectModels>
     */
    append_cards: function (cards) {
        cards.forEach((model) => {
            let card = this.create_submodule('card_type', {
                model: model,
            });
            card.connect('clicked', (card) => {
                this.emit('article-selected', card.model);
            });
            this._arrangement.add_card(card);
        });
    },
});
