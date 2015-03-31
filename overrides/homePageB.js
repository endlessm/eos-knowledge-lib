// Copyright 2014 Endless Mobile, Inc.

/* global private_imports */

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const HomePage = private_imports.homePage;
const Config = private_imports.config;

/**
 * Class: HomePageB
 *
 * This represents the home page for template B of the knowledge apps.
 * It extends <HomePage> and has a title image and list of article cards to show.
 * The list of cards only accepts 4, 6 or 8 cards.
 *
 */
const HomePageB = new Lang.Class({
    Name: 'HomePageB',
    GTypeName: 'EknHomePageB',
    Extends: HomePage.HomePage,

    _init: function (props) {
        this._card_container = new Gtk.Grid({
            column_homogeneous: true,
            row_homogeneous: true,
            hexpand: true
        });

        this.parent(props);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_HOME_PAGE_B);
    },

    _SEARCH_BOX_WIDTH: 350,
    pack_widgets: function (title_image, search_box) {
        title_image.vexpand = true;
        search_box.halign = Gtk.Align.CENTER;
        search_box.valign = Gtk.Align.CENTER;
        search_box.width_request = this._SEARCH_BOX_WIDTH;

        let card_container_frame = new Gtk.Frame();
        card_container_frame.get_style_context().add_class(EosKnowledge.STYLE_CLASS_CARD_CONTAINER);
        card_container_frame.add(this._card_container);

        this.row_homogeneous = true;
        this.attach(title_image, 0, 0, 1, 1);
        this.attach(search_box, 1, 0, 1, 1);
        this.attach(card_container_frame, 0, 1, 2, 2);
    },

    pack_cards: function (cards) {
        let _allowed_card_numbers = [4, 6, 8];
        if (_allowed_card_numbers.indexOf(cards.length) < 0)
            printerr('Should only set 4, 6 or 8 cards in template B. ' + cards.length);

        for (let card of this._card_container.get_children()) {
            this._card_container.remove(card);
        }
        // FIXME: For now we're always showing two rows of cards.
        // An alternative would be to show 1 row for 4 cards, and 2 rows otherwise
        // let columns = this._cards.length === 6 ? 3 : 4;
        let columns = cards.length / 2;
        let i = 0;
        for (let card of cards) {
            let col = i % columns;
            let row = Math.floor(i / columns);
            this._card_container.attach(card, col, row, 1, 1);
            i++;
        }
    }
});
