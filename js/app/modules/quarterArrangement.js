// Copyright 2016 Endless Mobile, Inc.

/* exported QuarterArrangement */

const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const HORIZONTAL_MODE = {
    TINY: 1,
    SMALL: 2,
    LARGE: 3,
};
const HORIZONTAL_THRESHOLD = {
    TINY: 720,
    SMALL: 900,
};
const FEATURED_CARD_HEIGHT = Card.MinSize.C;
const FEATURED_CARD_MIN_WIDTH = Card.MinSize.C;
const FEATURED_CARD_MAX_WIDTH = Card.MinSize.H;
const FEATURED_CARD_COUNT = {
    TINY: 2,
    SMALL: 3,
    LARGE: 4,
};
const SUPPORT_CARD_HEIGHT = Card.MinSize.B;
const SUPPORT_CARD_COUNT = 3;

/**
 * Class: QuarterArrangement
 * Arrangement with a row of (2-4) featured cards and as many supporting cards as desired
 *
 * This arrangement shows a row of featured cards featuring from two to four cards,
 * depending on the arrangement width. The featured row is followed by as many
 * supporting cards as needed in subsequent rows.
 *
 * Each row of supporting cards packs either two or three, depending on the total
 * width of the arrangement.
 */
const QuarterArrangement = new Lang.Class({
    Name: 'QuarterArrangement',
    GTypeName: 'EknQuarterArrangement',
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

        this.parent(props);

        // Initialize assuming we're on large mode
        this._horizontal_mode = HORIZONTAL_MODE.LARGE;
        this._featured_cards_to_show = FEATURED_CARD_COUNT.LARGE;
        this._support_cards_per_row = SUPPORT_CARD_COUNT;
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

    // Removal of any card should cause a recalculate
    vfunc_remove: function (widget) {
        this.parent(widget);
        this.queue_resize();
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        return [Arrangement.get_size_with_spacing(FEATURED_CARD_MIN_WIDTH, FEATURED_CARD_COUNT.TINY, this._spacing),
            Arrangement.get_size_with_spacing(FEATURED_CARD_MAX_WIDTH, FEATURED_CARD_COUNT.LARGE, this._spacing)];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        this._setup_horizontal_mode(width);
        let all_cards_count = this.get_children().length;

        // Calculate vertical space for featured cards row
        let featured_cards_height_alloc = FEATURED_CARD_HEIGHT + this._spacing;

        // Calculate vertical space for support card rows
        let support_cards = all_cards_count - this._featured_cards_to_show;
        let support_rows = Math.ceil(support_cards / this._support_cards_per_row);
        let support_cards_height_alloc = Arrangement.get_size_with_spacing(SUPPORT_CARD_HEIGHT, support_rows, this._spacing);
        let height = featured_cards_height_alloc + support_cards_height_alloc;

        return [height, height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let all_cards = this.get_children();
        // If arrangement has no child cards yet, simply exit
        if (all_cards.length === 0)
            return;

        this._setup_horizontal_mode(alloc.width);

        let featured_card_width = this._get_card_width(alloc.width, this._featured_cards_to_show);
        let spare_pixels = alloc.width - Arrangement.get_size_with_spacing(featured_card_width, this._featured_cards_to_show, this._spacing);

        let x = alloc.x;
        let y = alloc.y;
        let delta_x = featured_card_width + this._spacing + spare_pixels;

        // Featured cards:
        // Place two-four featured cards per row at top of arrangement
        all_cards.slice(0, this._featured_cards_to_show).forEach((card) => {
            this.place_card(card, x, y, featured_card_width, FEATURED_CARD_HEIGHT);
            x += delta_x;
        });

        let support_card_width = this._get_card_width(alloc.width, this._support_cards_per_row);
        spare_pixels = alloc.width - Arrangement.get_size_with_spacing(support_card_width, this._support_cards_per_row, this._spacing);

        x = alloc.x;
        y += FEATURED_CARD_HEIGHT + this._spacing;
        delta_x = support_card_width + this._spacing + spare_pixels;
        let delta_y = SUPPORT_CARD_HEIGHT + this._spacing;

        // Support cards:
        // Place rest of cards below the featured cards, in as many rows as needed
        all_cards.slice(this._featured_cards_to_show).forEach((card, ix) => {
            this.place_card(card, x, y, support_card_width, SUPPORT_CARD_HEIGHT);

            if ((ix + 1) % this._support_cards_per_row === 0) {
                x = alloc.x;
                y += delta_y;
            } else {
                x += delta_x + Arrangement.get_spare_pixels_for_card_index(spare_pixels, this._support_cards_per_row, ix);
            }
        });

        Utils.set_container_clip(this);
    },

    _setup_horizontal_mode: function (width) {
        if (width <= HORIZONTAL_THRESHOLD.TINY) {
            this._horizontal_mode = HORIZONTAL_MODE.TINY;
            this._featured_cards_to_show = FEATURED_CARD_COUNT.TINY;
            this._support_cards_per_row = SUPPORT_CARD_COUNT - 1;
        } else if (width <= HORIZONTAL_THRESHOLD.SMALL) {
            this._horizontal_mode = HORIZONTAL_MODE.SMALL;
            this._featured_cards_to_show = FEATURED_CARD_COUNT.SMALL;
            this._support_cards_per_row = SUPPORT_CARD_COUNT - 1;
        } else {
            this._horizontal_mode = HORIZONTAL_MODE.LARGE;
            this._featured_cards_to_show = FEATURED_CARD_COUNT.LARGE;
            this._support_cards_per_row = SUPPORT_CARD_COUNT;
        }
    },

    _get_card_width: function (total_width, card_count) {
        return Math.floor((total_width - (this._spacing * (card_count - 1))) / card_count);
    },
});
