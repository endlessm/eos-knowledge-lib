// Copyright 2015 Endless Mobile, Inc.

/* exported SearchABModule */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ContentObjectModel = imports.search.contentObjectModel;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;

/**
 * Class: SearchABModule
 *
 * FIXME! This class should be removed and the searchModule used instead.
 */
const SearchABModule = new Lang.Class({
    Name: 'SearchABModule',
    GTypeName: 'EknSearchABModule',
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
        /**
         * Event: need-more-content
         * This scrolled window needs more content to fill it up
         *
         * FIXME: This signal is temporary, and the dispatcher will make it
         * unnecessary.
         */
        'need-more-content': {},
    },

    _init: function (props={}) {
        this.parent(props);
        this._arrangement = this.create_submodule('arrangement');
        this.add(this._arrangement);
        if (this._arrangement instanceof InfiniteScrolledWindow.InfiniteScrolledWindow)
            this._arrangement.connect('need-more-content', () => this.emit('need-more-content'));
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
