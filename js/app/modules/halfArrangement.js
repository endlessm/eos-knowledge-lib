// Copyright 2015 Endless Mobile, Inc.

/* exported HalfArrangement */

const Cairo = imports.gi.cairo;
const Endless = imports.gi.Endless;
const GLib = imports.gi.GLib;
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

        /**
         * Property: spacing
         * The amount of space in pixels between children cards
         *
         * Default:
         *   0
         */
        'spacing': GObject.ParamSpec.uint('spacing', 'Spacing',
            'The amount of space in pixels between children cards',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXUINT16, 0),
    },

    _init: function (props={}) {
        this._spacing = 0;
        this._small_card_mode = false;
        this._cards_per_row = MAX_CARDS_PER_ROW;
        this._featured_cards_count = FEATURED_CARDS_PER_ROW;

        this.parent(props);
    },

    add_card: function (widget) {
        this.add(widget);
    },

    get_cards: function () {
        return this.get_children();
    },

    clear: function () {
        this.get_children().forEach((child) => this.remove(child));
    },

    vfunc_get_preferred_width: function () {
        return [MINIMUM_ARRANGEMENT_WIDTH + this._spacing, FOUR_CARDS_THRESHOLD * 2];
    },

    vfunc_get_preferred_height: function () {
        this._featured_cards_count = this._get_featured_cards_count();
        // Calculate space for featured cards
        let featured_rows = Math.ceil(this._featured_cards_count / FEATURED_CARDS_PER_ROW);
        let req_height = this._get_size_with_spacing(FEATURED_CARD_HEIGHT, featured_rows);

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
            let card_alloc = new Gdk.Rectangle({
                x: x,
                y: y,
                width: featured_card_width,
                height: FEATURED_CARD_HEIGHT,
            });
            card.size_allocate(card_alloc);
            card.set_child_visible(true);

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
            let card_alloc = new Gdk.Rectangle({
                x: x,
                y: y,
                width: card_width,
                height: card_height,
            });
            card.size_allocate(card_alloc);
            card.set_child_visible(true);

            if ((ix + 1) % this._cards_per_row === 0) {
                x = alloc.x;
                y += card_height + this._spacing;
            } else {
                x += delta_x + this._get_spare_pixels_for_card_index(spare_pixels, ix);
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

    _get_spare_pixels_for_card_index: function (spare_pixels, ix) {
        if (spare_pixels === 0)
            return 0;

        // All gutters need an extra pixel
        if (spare_pixels === this._cards_per_row - 1)
            return 1;

        let column = ix % this._cards_per_row;
        let num_gutters = this._cards_per_row - 1;

        // Assign a spare pixel to the center gutter if that helps keep things symmetric
        if (num_gutters % 2 === 1 && spare_pixels % 2 === 1) {
            if (column === (num_gutters - 1) / 2)
                return 1;
            spare_pixels--;
        }
        // Assign remaining spare pixels to alternating columns on either side
        if (column < Math.ceil(spare_pixels / 2))
            return 1;
        if (column >= num_gutters - Math.floor(spare_pixels / 2))
            return 1;
        return 0;
    },

    _get_featured_cards_count: function () {
        return this.get_children().length > 4 ? FEATURED_CARDS_PER_ROW : this.get_children().length;
    },

    _get_size_with_spacing: function (size, count) {
        return size * count + this._spacing * (count - 1);
    },
});
