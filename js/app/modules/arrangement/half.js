// Copyright 2015 Endless Mobile, Inc.

/* exported Half */

const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const Knowledge = imports.app.knowledge;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const FEATURED_CARDS_PER_ROW = 2;
const MAX_CARDS_PER_ROW = 4;
const MIN_CARDS_PER_ROW = 3;
const FOUR_CARDS_THRESHOLD = 4 * Card.MinSize.C;
const SMALL_CARDS_THRESHOLD = 3 * Card.MinSize.C;
const FEATURED_CARD_HEIGHT = Card.MinSize.C;
const CARD_HEIGHT_MIN = Card.MinSize.C;
const CARD_HEIGHT_MAX = Card.MaxSize.C;
const MINIMUM_ARRANGEMENT_WIDTH = 2 * Card.MinSize.C;

const _HalfLayout = new Knowledge.Class({
    Name: 'Arrangement.HalfLayout',
    Extends: Endless.CustomContainer,

    _init: function (props={}) {
        this._small_card_mode = false;
        this._cards_per_row = MAX_CARDS_PER_ROW;
        this._featured_cards_count = FEATURED_CARDS_PER_ROW;

        this.parent(props);
    },

    // Removal of any card should cause a recalculate
    vfunc_remove: function (widget) {
        this.parent(widget);
        this.queue_resize();
    },

    vfunc_get_preferred_width: function () {
        return [MINIMUM_ARRANGEMENT_WIDTH, FOUR_CARDS_THRESHOLD * 2];
    },

    vfunc_get_preferred_height: function () {
        this._featured_cards_count = this._get_featured_cards_count();
        // Calculate space for featured cards
        let featured_rows = Math.ceil(this._featured_cards_count / FEATURED_CARDS_PER_ROW);
        let req_height = FEATURED_CARD_HEIGHT * featured_rows;

        // Calculate space for support cards
        let children_count = this.get_children().length - this._featured_cards_count;
        let children_rows = Math.ceil(children_count / this._cards_per_row);
        let card_height = this._small_card_mode ? CARD_HEIGHT_MIN : CARD_HEIGHT_MAX;
        req_height += card_height * children_rows;
        return [req_height, req_height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        this._featured_cards_count = this._get_featured_cards_count();
        let three_column_mode = alloc.width < FOUR_CARDS_THRESHOLD;
        this._small_card_mode = alloc.width < SMALL_CARDS_THRESHOLD;
        this._cards_per_row = (three_column_mode ? MIN_CARDS_PER_ROW : MAX_CARDS_PER_ROW);

        let featured_card_width = Math.floor(alloc.width / FEATURED_CARDS_PER_ROW);
        let spare_pixels = alloc.width - (featured_card_width * FEATURED_CARDS_PER_ROW);

        let x = alloc.x;
        let y = alloc.y;
        let delta_x = featured_card_width + spare_pixels;
        let delta_y = FEATURED_CARD_HEIGHT;

        let all_cards = this.get_parent().get_cards();

        // Featured cards:
        // Place two featured cards per row at top of arrangement
        all_cards.slice(0, this._featured_cards_count).forEach((card, ix) => {
            Arrangement.place_card(card, x, y, featured_card_width, FEATURED_CARD_HEIGHT);

            if ((ix + 1) % FEATURED_CARDS_PER_ROW === 0) {
                x = alloc.x;
                y += delta_y;
            } else {
                x += delta_x;
            }
        });

        x = alloc.x;
        let card_width = Math.floor(alloc.width / this._cards_per_row);
        let card_height = this._small_card_mode ? FEATURED_CARD_HEIGHT : CARD_HEIGHT_MAX;
        delta_x = card_width;

        // Calculate spare pixels
        // The floor operation we do above may lead us to have 1..3 spare pixels
        spare_pixels = alloc.width - (card_width * this._cards_per_row);

        // Child cards
        // Place rest of cards below the featured cards, in as many rows as needed
        all_cards.slice(this._featured_cards_count).forEach((card, ix) => {
            Arrangement.place_card(card, x, y, card_width, card_height);

            if ((ix + 1) % this._cards_per_row === 0) {
                x = alloc.x;
                y += card_height;
            } else {
                x += delta_x + Arrangement.get_spare_pixels_for_card_index(spare_pixels, this._cards_per_row, ix);
            }
        });
        Utils.set_container_clip(this);
    },

    _get_featured_cards_count: function () {
        let card_count = this.get_children().length;
        return card_count > 4 ? FEATURED_CARDS_PER_ROW : card_count;
    },
});

/**
 * Class: Half
 * Arrangement with two featured cards and as many supporting cards as desired
 *
 * This arrangement shows two featured cards in the first row, followed by as
 * many supporting cards as needed in subsequent rows.
 *
 * Each row of supporting cards packs either three or four, depending on the
 * total width of the arrangement.
 */
var Half = new Module.Class({
    Name: 'Arrangement.Half',
    Extends: Gtk.Grid,
    Implements: [Arrangement.Arrangement],

    _init: function (props={}) {
        this._layout = new _HalfLayout({
            visible: true,
            expand: true,
        });
        this.parent(props);

        this.add(this._layout);
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
