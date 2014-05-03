// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

/**
 * Class: HomePageA
 *
 * This represents the home page for template A of the knowledge apps.
 * It has a title, subtitle, and list of article cards to show
 *
 */
const HomePageA = new Lang.Class({
    Name: 'HomePageA',
    GTypeName: 'EknHomePageA',
    Extends: Gtk.Grid,
    Properties: {
        /**
         * Property: title
         * A string with the title of the home page. Defaults to an empty string.
         */
        'title': GObject.ParamSpec.string('title', 'Page Title',
            'Title of the page',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
        /**
         * Property: subtitle
         * A string with the subtitle of the home page. Defaults to an empty string.
         */
        'subtitle': GObject.ParamSpec.string('subtitle', 'Page Subtitle',
            'Subtitle of the page',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, '')

        /**
         * Property: cards
         * A list of Card objects representing the cards to be displayed on this page.
         * It is set as a normal javascript object since GJS does not support setting
         * objects using ParamSpec.
         */
    },
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
        this._title_label = new Gtk.Label();
        this._subtitle_label = new Gtk.Label();

        this._cards = null;
        this._title = null;
        this._subtitle = null;

        props.orientation = Gtk.Orientation.VERTICAL;

        this._card_container = new HomePageACardContainer({
            halign: Gtk.Align.CENTER
        });

        // Not using a SearchEntry since that comes with
        // the 'x' as secondary icon, which we don't want
        this._search_box = new Gtk.Entry({
            margin_top: 30,
            primary_icon_name: 'edit-find-symbolic'
        });

        this._search_box.connect('activate', Lang.bind(this, this._on_search_entered));

        this.parent(props);

        let grid = new Gtk.Grid({
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
            expand: true,
            orientation: Gtk.Orientation.VERTICAL
        });

        grid.attach(this._title_label, 0, 0, 3, 1);

        let left_line = new Gtk.Separator();
        let right_line = new Gtk.Separator();

        grid.attach(left_line, 0, 1, 1, 1);
        grid.attach(this._subtitle_label, 1, 1, 1, 1);
        grid.attach(right_line, 2, 1, 1, 1);
        grid.attach(this._search_box, 0, 2, 3, 1);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_HOME_PAGE);
        this._title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_HOME_PAGE_TITLE);
        this._subtitle_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_HOME_PAGE_SUBTITLE);
        this._search_box.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SEARCH_BOX);
        this._card_container.get_style_context().add_class(EosKnowledge.STYLE_CLASS_CARD_CONTAINER);

        this.add(grid);
        this.add(this._card_container)
        this.show_all();
    },

    set title (v) {
        if (this._title === v) return;
        this._title = v;
        this._title_label.label = this._title.toUpperCase();
        this.notify('title');
    },

    get title () {
        if (this._title)
            return this._title;
        return '';
    },

    set subtitle (v) {
        if (this._subtitle === v) return;
        this._subtitle = v;
        this._subtitle_label.label = this._subtitle;
        this.notify('subtitle');
    },

    get subtitle () {
        if (this._subtitle)
            return this._subtitle;
        return '';
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
    },

    _on_search_entered: function (widget) {
        this.emit('search-entered', widget.text);
    },

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
