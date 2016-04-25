// Copyright 2016 Endless Mobile, Inc.

/* exported PianoArrangement */

const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const CARD_WIDTH_SMALL = Card.MinSize.B;
const CARD_WIDTH_BIG = Card.MinSize.C;
const CARD_SIZE_MAX = Card.MinSize.H;
const CARD_HEIGHT = Card.MinSize.B;
const DEFAULT_SUPPORT_CARD_COUNT = 3;
const HORIZONTAL_PROPORTION = 3;
const FEATURED_CARD_WIDTH_FRACTION = 2 / 3;

/**
 * Class: PianoArrangement
 * Arrangement with featured card on prominent spot and three supporting cards
 *
 * This arrangement shows a featured card in a very prominent spot, followed by
 * three secondary cards at its right side.
 */
const PianoArrangement = new Module.Class({
    Name: 'PianoArrangement',
    CssName: 'EknPianoArrangement',
    Extends: Endless.CustomContainer,
    Implements: [Arrangement.Arrangement],

    Properties: {
        /**
         * Property: compact-mode
         * Whether the arrangement should show its compact form
         *
         * By default, the Piano Arrangement shows three support cards at the right
         * hand side of the featured card. But in compact mode, only two support
         * cards are shown.
         *
         * Default:
         *   false (default arrangement layout)
         */
        'compact-mode': GObject.ParamSpec.boolean('compact-mode',
            'Compact mode',
            'Whether the arrangement should show its compact form',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    _init: function (props={}) {
        this._spacing = 0;
        this._compact_mode = false;
        this._support_card_count = DEFAULT_SUPPORT_CARD_COUNT;

        this.parent(props);
    },

    get_max_cards: function () {
        return this._support_card_count + 1;
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

    get compact_mode() {
        return this._compact_mode;
    },

    set compact_mode(value) {
        if (this._compact_mode === value)
            return;
        this._compact_mode = value;
        this.notify('compact-mode');
        this._support_card_count = this._compact_mode ? DEFAULT_SUPPORT_CARD_COUNT - 1 : DEFAULT_SUPPORT_CARD_COUNT;
    },

    get all_visible() {
        this._support_cards_shown = this._calculate_support_cards_shown(this.get_allocation().width);
        return this.get_card_count() <= (1 + this._support_cards_shown);
    },

    // Arrangement override
    fade_card_in: function (card) {
        card.show_all();
    },

    // Removing a visible widget should recalculate the positions of all widgets
    vfunc_remove: function (widget) {
        let needs_resize = widget.get_child_visible();
        this.parent(widget);
        if (needs_resize)
            this.queue_resize();
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        return [Arrangement.get_size_with_spacing(CARD_WIDTH_SMALL, HORIZONTAL_PROPORTION, this._spacing),
            Arrangement.get_size_with_spacing(CARD_SIZE_MAX, HORIZONTAL_PROPORTION, this._spacing)];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        this._support_cards_shown = this._calculate_support_cards_shown(width);
        let height = Arrangement.get_size_with_spacing(CARD_HEIGHT, this._support_cards_shown, this._spacing);
        return [height, height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let count = this.get_card_count();
        if (count === 0)
            return;

        let all_cards = this.get_filtered_models()
            .map(this.get_card_for_model, this);

        this._support_cards_shown = this._calculate_support_cards_shown(alloc.width);
        let available_width = alloc.width - this._spacing;

        let featured_width = Math.floor(available_width * FEATURED_CARD_WIDTH_FRACTION);
        let featured_height = Arrangement.get_size_with_spacing(CARD_HEIGHT, this._support_cards_shown, this._spacing);
        let child_width = Math.floor(available_width * (1 - FEATURED_CARD_WIDTH_FRACTION));
        let child_height = CARD_HEIGHT;
        let delta_y = child_height + this._spacing;

        // Calculate spare pixels
        // The floor operation we do above may lead us to have 1,2 spare pixels
        let spare_pixels = alloc.height - (Arrangement.get_size_with_spacing(child_height, this._support_cards_shown, this._spacing));

        // Featured card:
        // Place the featured card at the left hand side of the arrangement
        // FIXME: For now, we show the first-added card as the featured card.
        // This should change to have a model with the featured flag added in
        // this spot, but for that we'd need the arrangement interface to
        // receive a model, instead of a widget in the "add" method.
        let featured_card = all_cards[0];
        this.place_card(featured_card, alloc.x, alloc.y, featured_width, featured_height);

        let x = alloc.x + featured_width + this._spacing;
        let y = alloc.y;

        // Support cards:
        // Place support cards in a column to the right of the featured card
        all_cards.slice(1, this._support_cards_shown + 1).forEach((card, i) => {
            this.place_card(card, x, y, child_width, child_height);

            y += delta_y + (i < spare_pixels ? 1 : 0);
        });

        // Additional cards:
        // Should not be visible!
        all_cards.slice(this._support_cards_shown + 1, count).forEach((card) => {
            card.set_child_visible(false);
        });
        Utils.set_container_clip(this);
    },

    _calculate_support_cards_shown: function (width) {
        if (this._compact_mode) {
            return this._support_card_count;
        }

        if (width < Arrangement.get_size_with_spacing(CARD_WIDTH_BIG, HORIZONTAL_PROPORTION, this._spacing)) {
            return this._support_card_count - 1;
        } else {
            return this._support_card_count;
        }
    },
});
