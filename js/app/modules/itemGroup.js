// Copyright 2015 Endless Mobile, Inc.

/* exported ItemGroup */

const GLib = imports.gi.GLib;
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
        this._arrangement = this.create_submodule('arrangement');
        this.add(this._arrangement);
    },

    // Module override
    get_slot_names: function () {
        return ['arrangement', 'card_type'];
    },

    /**
     * Method: clear
     * Remove all cards from the arrangement
     */
    clear: function () {
        this._arrangement.clear();
    },

    /**
     * Method: add_card
     * Add a card to the arrangement
     *
     * Parameters:
     *   card - a <Card> implementation
     */
    add_card: function (model) {
        let card = this.create_submodule('card_type', {
            model: model,
        });
        card.connect('clicked', (card) => {
            this.emit('article-selected', card.model);
        });
        this._arrangement.add_card(card);
    },
});
