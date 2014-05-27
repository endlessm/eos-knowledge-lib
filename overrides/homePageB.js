// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const HomePage = imports.homePage;

/**
 * Class: HomePageB
 *
 * This represents the home page for template B of the knowledge apps.
 * It extends <HomePage> and has a title, subtitle, and list of article cards to show.
 * The list of cards only accepts 4, 6 or 8 cards.
 *
 */
const HomePageB = new Lang.Class({
    Name: 'HomePageB',
    GTypeName: 'EknHomePageB',
    Extends: HomePage.HomePage,

    _init: function (props) {

        props = props || {};
        props.has_search_box = false;
        this.parent(props);

        this._card_container = new Gtk.Grid({
            halign: Gtk.Align.CENTER,
            column_homogeneous: true,
            row_homogeneous: true
        });
        this._card_container.get_style_context().add_class(EosKnowledge.STYLE_CLASS_CARD_CONTAINER);

        this.set_styles({
            home_page: EosKnowledge.STYLE_CLASS_HOME_PAGE_B,
            home_page_title: EosKnowledge.STYLE_CLASS_HOME_PAGE_B_TITLE,
            home_page_subtitle: EosKnowledge.STYLE_CLASS_HOME_PAGE_B_SUBTITLE
        });
        this.add(this._card_container);
    },

    set cards (v) {
        if (this._cards === v)
            return;
        let _allowed_card_numbers = [4, 6, 8];
        if (_allowed_card_numbers.indexOf(v.length) < 0)
            throw new Error('Can only set 4, 6 or 8 cards. ' + v.length);
        if (this._cards !== null)
            this._remove_cards_from_grid();
        this._cards = v;
        if (this._cards !== null)
            this._add_cards_to_grid(this._cards);
    },

    get cards () {
        return this._cards;
    },

    _add_cards_to_grid: function () {
        // FIXME: For now we're always showing two rows of cards.
        // An alternative would be to show 1 row for 4 cards, and 2 rows otherwise
        // let columns = this._cards.length === 6 ? 3 : 4;
        let columns = this._cards.length / 2; 
        let i = 0;
        for (let card of this._cards) {
            let col = i % columns;
            let row = Math.floor(i / columns);
            this._card_container.attach(card, col, row, 1, 1);
            i++;
        }
    },

    _remove_cards_from_grid: function () {
        for (let card of this._cards) {
            this._card_container.remove(card);
        }
    }
});
