// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const HomePage = imports.homePage;

/**
 * Class: HomePageA
 *
 * This represents the home page for template A of the knowledge apps.
 * It extends <HomePage> and has a title, subtitle, and list of article cards to show
 *
 */
const HomePageA = new Lang.Class({
    Name: 'HomePageA',
    GTypeName: 'EknHomePageA',
    Extends: HomePage.HomePage,
    Signals: {
        /**
         * Event: search-entered
         * This event is triggered when the search box is activated. The parameter
         * is the search query.
         */
        'search-entered': {
            param_types: [GObject.TYPE_STRING]
        }
    },

    _init: function (props) {

        props = props || {};
        props.has_search_box = true;
        this.parent(props);

        this._card_container = new HomePageACardContainer({
            halign: Gtk.Align.CENTER
        });
        this._card_container.get_style_context().add_class(EosKnowledge.STYLE_CLASS_CARD_CONTAINER);

        this.set_styles({
            'home_page': EosKnowledge.STYLE_CLASS_HOME_PAGE_A,
            'home_page_title': EosKnowledge.STYLE_CLASS_HOME_PAGE_A_TITLE,
            'home_page_subtitle': EosKnowledge.STYLE_CLASS_HOME_PAGE_A_SUBTITLE,
            'search_box': EosKnowledge.STYLE_CLASS_SEARCH_BOX
        });

        this.add(this._card_container);
        this.show_all();
    },

    set cards (v) {
        if (this._cards === v)
            return;
        if (this._cards !== null)
            this._card_container.remove_cards();
        this._cards = v;
        if (this._cards !== null)
            this._card_container.add_cards(this._cards);
    },

    get cards () {
        return this._cards;
    }
});

// Private class to handle the special card container we need on the home
// page. Will show as many cards horizontally as there are space for, though
// always shows at least one card.
const HomePageACardContainer = new Lang.Class({
    Name: 'HomePageACardContainer',
    GTypeName: 'EknHomePageACardContainer',
    Extends: Endless.CustomContainer,

    _init: function (props) {
        this._cards = [];
        this.parent(props);
    },

    add_cards: function (cards) {
        this._cards = cards;
        for (let card of cards) {
            this.add(card);
        }
    },

    remove_cards: function () {
        for (let card of this._cards) {
            this.remove(card);
        }
        this._cards = [];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        if (this._cards.length === 0)
            return;
        let [min, nat] = this._cards_max_preferred_width();
        let visible_cards =  Math.floor(alloc.width / min);
        let total_width = alloc.width;
        alloc.width  = Math.min(alloc.width / visible_cards, nat);
        // Always center the cards in the given allocation
        let extra_width = total_width - alloc.width * visible_cards;
        alloc.x += extra_width / 2;
        for (let card_index = 0; card_index < this._cards.length; card_index++) {
            let card = this._cards[card_index];
            if (card_index < visible_cards) {
                card.size_allocate(alloc);
                alloc.x += alloc.width;
                card.set_child_visible(true);
            } else {
                card.set_child_visible(false);
            }
        }
    },

    _cards_max_preferred_width: function () {
        let min = 0, nat = 0;
        for (let card of this._cards) {
            let [card_min, card_nat] = card.get_preferred_width();
            min = Math.max(min, card_min);
            nat = Math.max(nat, card_nat);
        }
        return [min, nat];
    },

    vfunc_get_preferred_width: function () {
        let [min, nat] = this._cards_max_preferred_width();
        // Try to show all cards at natural width, but at worst we show one at
        // minimal width.
        return [min, nat * this._cards.length];
    },

    vfunc_get_preferred_height: function () {
        let min = 0, nat = 0;
        for (let card of this._cards) {
            let [card_min, card_nat] = card.get_preferred_height();
            min = Math.max(min, card_min);
            nat = Math.max(nat, card_nat);
        }
        return [min, nat];
    }
});
