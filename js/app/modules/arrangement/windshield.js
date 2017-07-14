// Copyright 2015 Endless Mobile, Inc.

/* exported Windshield */

const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const Knowledge = imports.app.knowledge;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const SECOND_ROW_CARD_COUNT = 3;
const CARD_SIZE_SMALL = Card.MinSize.B;
const CARD_SIZE_BIG = Card.MinSize.C;
const CARD_SIZE_MAX = Card.MinSize.D;

const _WindshieldLayout = new Knowledge.Class({
    Name: 'Arrangement.WindshieldLayout',
    Extends: Endless.CustomContainer,

    _init: function (props={}) {
        this._small_mode = false;

        this.parent(props);
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        return [CARD_SIZE_SMALL * SECOND_ROW_CARD_COUNT, CARD_SIZE_MAX * SECOND_ROW_CARD_COUNT];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        this._small_mode = (width < CARD_SIZE_BIG * SECOND_ROW_CARD_COUNT);
        let card_size = CARD_SIZE_SMALL * (this._small_mode ? SECOND_ROW_CARD_COUNT - 1 : SECOND_ROW_CARD_COUNT);
        let height = card_size;
        return [height, height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let count = this.get_children().length;
        if (count === 0)
            return;

        let all_cards = this.get_parent().get_cards();

        this._small_mode = (alloc.width < CARD_SIZE_BIG * SECOND_ROW_CARD_COUNT);

        let featured_height_factor = this._small_mode ? 0.5 : 2 / 3;
        let featured_height = Math.floor(alloc.height * featured_height_factor);
        let child_width = Math.floor(alloc.width / SECOND_ROW_CARD_COUNT);
        let child_height = Math.floor(alloc.height * (1 - featured_height_factor));
        let delta_x = child_width;

        // Calculate spare pixels
        // The floor operation we do above may lead us to have 1,2 spare pixels
        let spare_pixels = alloc.width - (child_width * SECOND_ROW_CARD_COUNT);

        // Featured card:
        // Place the featured card at the at top of the arrangement
        // FIXME: For now, we show the first-added card as the featured card.
        // This should change to have a model with the featured flag added in
        // this spot, but for that we'd need the arrangement interface to
        // receive a model, instead of a widget in the "add" method.
        let featured_card = all_cards[0];
        Arrangement.place_card(featured_card, alloc.x, alloc.y, alloc.width, featured_height);

        let x = alloc.x;
        let y = alloc.y + featured_height;

        // Support cards:
        // Place three support cards in a row below the featured cards
        all_cards.slice(1, SECOND_ROW_CARD_COUNT + 1).forEach((card, i) => {
            Arrangement.place_card(card, x, y, child_width, child_height);

            x += delta_x + (i < spare_pixels ? 1 : 0);
        });

        // Additional cards:
        // Should not be visible!
        all_cards.slice(SECOND_ROW_CARD_COUNT + 1, count).forEach((card) => {
            card.set_child_visible(false);
        });
        Utils.set_container_clip(this);
    },
});

/**
 * Class: Windshield
 * Arrangement with featured card on prominent spot and three supporting cards
 *
 * This arrangement shows a featured card in a very prominent spot, followed by
 * three secondary cards.
 */
const Windshield = new Module.Class({
    Name: 'Arrangement.Windshield',
    Extends: Gtk.Grid,
    Implements: [Arrangement.Arrangement],

    _init: function (props={}) {
        this._layout = new _WindshieldLayout({
            visible: true,
            expand: true,
        });
        this.parent(props);

        this.add(this._layout);
    },

    // Arrangement override
    fade_card_in: function (card) {
        card.show_all();
    },

    // Arrangement implementation
    get_max_cards: function () {
        return SECOND_ROW_CARD_COUNT + 1;
    },

    // Arrangement override
    pack_card: function (card) {
        this._layout.add(card);
    },

    // Arrangement override
    unpack_card: function (card) {
        this._layout.remove(card);
    },
});
