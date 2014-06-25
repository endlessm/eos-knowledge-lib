// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Config = imports.config;
const HomePage = imports.homePage;
const TabButton = imports.tabButton;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const BUTTON_TRANSITION_DURATION = 500;

/**
 * Class: HomePageA
 *
 * This represents the home page for template A of the knowledge apps.
 * It extends <HomePage> and has a title image and list of article cards to show
 *
 */
const HomePageA = new Lang.Class({
    Name: 'HomePageA',
    GTypeName: 'EknHomePageA',
    Extends: HomePage.HomePage,
    Signals: {
        /**
         * Event: show-categories
         * This event is triggered when the categories button is clicked.
         */
        'show-categories': {}
    },

    _init: function (props) {
        this._card_container = new HomePageACardContainer({
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
            expand: true
        });
        this._card_container.get_style_context().add_class(EosKnowledge.STYLE_CLASS_CARD_CONTAINER);

        this._button_stack = new Gtk.Stack({
            transition_duration: BUTTON_TRANSITION_DURATION
        });

        this._invisible_frame = new Gtk.Frame();

        this._all_categories_button = new TabButton.TabButton({
            position: Gtk.PositionType.BOTTOM,
            label: _("SEE ALL CATEGORIES")
        });

        this._button_stack.connect('notify::transition-running', Lang.bind(this, function () {
            let categories_page_request = !this._button_stack.transition_running && this._button_stack.visible_child != this._all_categories_button;
            if (!this._button_stack.transition_running && this._button_stack.visible_child != this._all_categories_button) {
                this.emit('show-categories');
            }
        }));

        this._all_categories_button.connect('clicked', this._onAllCategoriesClicked.bind(this));

        this._button_stack.add(this._all_categories_button);
        this._button_stack.add(this._invisible_frame);

        this.parent(props);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_HOME_PAGE_A);
    },

    _onAllCategoriesClicked: function (widget) {
        this._button_stack.transition_type = Gtk.StackTransitionType.SLIDE_DOWN,
        this._button_stack.visible_child = this._invisible_frame;
    },

    showButton: function () {
        this._button_stack.transition_type = Gtk.StackTransitionType.SLIDE_UP;
        this._button_stack.visible_child = this._all_categories_button;
    },

    pack_widgets: function () {
        this.search_box.margin_top = 30;

        let inner_grid = new Gtk.Grid({
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.END,
            expand: true,
            orientation: Gtk.Orientation.VERTICAL
        });
        inner_grid.attach(this.title_image, 0, 0, 3, 1);
        inner_grid.attach(this.search_box, 0, 1, 3, 1);

        this.orientation = Gtk.Orientation.VERTICAL;
        this.add(inner_grid);
        this.add(this._card_container);
        this.add(this._button_stack);
    },

    pack_cards: function (cards) {
        this._card_container.remove_cards();
        this._card_container.add_cards(this._cards);
    }
});

// Private class to handle the special card container we need on the home
// page. Will show as many cards horizontally as there are space for, though
// always shows at least one card.
const HomePageACardContainer = new Lang.Class({
    Name: 'HomePageACardContainer',
    GTypeName: 'EknHomePageACardContainer',
    Extends: Endless.CustomContainer,

    CARD_EXTRA_MARGIN: 8,

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
        min += this.CARD_EXTRA_MARGIN;
        nat += this.CARD_EXTRA_MARGIN;
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
