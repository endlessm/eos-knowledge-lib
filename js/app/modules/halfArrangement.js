// Copyright 2015 Endless Mobile, Inc.

/* exported HalfArrangement */

const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
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

/**
 * Class: HalfArrangement
 * Arrangement with two featured cards and as many supporting cards as desired
 *
 * This arrangement shows two featured cards in the first row, followed by as
 * many supporting cards as needed in subsequent rows.
 *
 * Each row of supporting cards packs either three or four, depending on the
 * total width of the arrangement.
 */
const HalfArrangement = new Lang.Class({
    Name: 'HalfArrangement',
    Extends: Endless.CustomContainer,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'all-visible': GObject.ParamSpec.override('all-visible', Arrangement.Arrangement),
        'spacing': GObject.ParamSpec.override('spacing', Arrangement.Arrangement),
    },

    _init: function (props={}) {
        this._spacing = 0;
        this._small_card_mode = false;
        this._cards_per_row = MAX_CARDS_PER_ROW;
        this._featured_cards_count = FEATURED_CARDS_PER_ROW;

        this.parent(props);
    },

    // Arrangement implementation
    add_card: function (widget) {
        this.add(widget);
    },

    // Arrangement implementation
    get_cards: function () {
        return this.get_children();
    },

    // Arrangement implementation
    clear: function () {
        this.get_children().forEach((child) => this.remove(child));
    },

    // Removal of any card should cause a recalculate
    vfunc_remove: function (widget) {
        this.parent(widget);
        this.queue_resize();
    },

    vfunc_get_preferred_width: function () {
        return [MINIMUM_ARRANGEMENT_WIDTH + this._spacing, FOUR_CARDS_THRESHOLD * 2];
    },

    vfunc_get_preferred_height: function () {
        this._featured_cards_count = this._get_featured_cards_count();
        // Calculate space for featured cards
        let featured_rows = Math.ceil(this._featured_cards_count / FEATURED_CARDS_PER_ROW);
        let req_height = Arrangement.get_size_with_spacing(FEATURED_CARD_HEIGHT, featured_rows, this._spacing);

        // Calculate space for support cards
        let children_count = this.get_children().length - this._featured_cards_count;
        let children_rows = Math.ceil(children_count / this._cards_per_row);
        let card_height = this._small_card_mode ? CARD_HEIGHT_MIN : CARD_HEIGHT_MAX;
        req_height += card_height * children_rows + this._spacing * (children_rows - 1);
        return [req_height, req_height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        this._featured_cards_count = this._get_featured_cards_count();
        let three_column_mode = alloc.width + (MIN_CARDS_PER_ROW * this._spacing) < FOUR_CARDS_THRESHOLD;
        this._small_card_mode = alloc.width < SMALL_CARDS_THRESHOLD;
        this._cards_per_row = (three_column_mode ? MIN_CARDS_PER_ROW : MAX_CARDS_PER_ROW);

        let featured_card_width = Math.floor((alloc.width - this._spacing) / FEATURED_CARDS_PER_ROW);
        let spare_pixels = alloc.width - (featured_card_width * FEATURED_CARDS_PER_ROW + this._spacing);

        let x = alloc.x;
        let y = alloc.y;
        let delta_x = featured_card_width + this._spacing + spare_pixels;
        let delta_y = FEATURED_CARD_HEIGHT + this._spacing;

        let all_children = this.get_children();

        // Featured cards:
        // Place two featured cards per row at top of arrangement
        all_children.slice(0, this._featured_cards_count).forEach((card, ix) => {
            this.place_card(card, x, y, featured_card_width, FEATURED_CARD_HEIGHT);

            if ((ix + 1) % FEATURED_CARDS_PER_ROW === 0) {
                x = alloc.x;
                y += delta_y;
            } else {
                x += delta_x;
            }
        });

        x = alloc.x;
        let gutters_per_row = this._cards_per_row - 1;
        let card_width = Math.floor((alloc.width - gutters_per_row * this._spacing) / this._cards_per_row);
        let card_height = this._small_card_mode ? FEATURED_CARD_HEIGHT : CARD_HEIGHT_MAX;
        delta_x = card_width + this._spacing;

        // Calculate spare pixels
        // The floor operation we do above may lead us to have 1..3 spare pixels
        spare_pixels = alloc.width - (card_width * this._cards_per_row + this._spacing * gutters_per_row);

        // Child cards
        // Place rest of cards below the featured cards, in as many rows as needed
        all_children.slice(this._featured_cards_count).forEach((card, ix) => {
            this.place_card(card, x, y, card_width, card_height);

            if ((ix + 1) % this._cards_per_row === 0) {
                x = alloc.x;
                y += card_height + this._spacing;
            } else {
                x += delta_x + Arrangement.get_spare_pixels_for_card_index(spare_pixels, this._cards_per_row, ix);
            }
        });
        Utils.set_container_clip(this);
    },

    get spacing() {
        return this._spacing;
    },

    set spacing(value) {
        if (this._spacing === value)
            return;
        this._spacing = value;
        this.notify('spacing');
        this.queue_resize();
    },

    _get_featured_cards_count: function () {
        return this.get_children().length > 4 ? FEATURED_CARDS_PER_ROW : this.get_children().length;
    },
});
