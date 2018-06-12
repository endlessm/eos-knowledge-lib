// Copyright 2016 Endless Mobile, Inc.

/* exported Piano */

const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Arrangement = imports.framework.interfaces.arrangement;
const Card = imports.framework.interfaces.card;
const Knowledge = imports.framework.knowledge;
const Module = imports.framework.interfaces.module;
const Utils = imports.framework.utils;

const CARD_WIDTH_SMALL = Card.MinSize.B;
const CARD_WIDTH_BIG = Card.MinSize.C;
const CARD_SIZE_MAX = Card.MinSize.H;
const CARD_HEIGHT = Card.MinSize.B;
const DEFAULT_SUPPORT_CARD_COUNT = 3;
const HORIZONTAL_PROPORTION = 3;
const FEATURED_CARD_WIDTH_FRACTION = 2 / 3;

const _PianoLayout = new Knowledge.Class({
    Name: 'Arrangement.PianoLayout',
    Extends: Endless.CustomContainer,

    _init: function (props={}) {
        this._compact_mode = false;
        this._support_card_count = DEFAULT_SUPPORT_CARD_COUNT;

        this.parent(props);
    },

    get compact_mode() {
        return this._compact_mode;
    },

    set compact_mode(value) {
        this._compact_mode = value;
        this._support_card_count = this._compact_mode ? DEFAULT_SUPPORT_CARD_COUNT - 1 : DEFAULT_SUPPORT_CARD_COUNT;
    },

    get all_visible() {
        this._support_cards_shown = this._calculate_support_cards_shown(this.get_allocation().width);
        return this.get_children().length <= (1 + this._support_cards_shown);
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        return [CARD_WIDTH_SMALL * HORIZONTAL_PROPORTION, CARD_SIZE_MAX * HORIZONTAL_PROPORTION];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        this._support_cards_shown = this._calculate_support_cards_shown(width);
        let height = CARD_HEIGHT * this._support_cards_shown;
        return [height, height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let count = this.get_children().length;
        if (count === 0)
            return;

        let all_cards = this.get_parent().get_cards();

        this._support_cards_shown = this._calculate_support_cards_shown(alloc.width);

        let featured_width = Math.floor(alloc.width * FEATURED_CARD_WIDTH_FRACTION);
        let featured_height = CARD_HEIGHT * this._support_cards_shown;
        let child_width = Math.floor(alloc.width * (1 - FEATURED_CARD_WIDTH_FRACTION));
        let child_height = CARD_HEIGHT;
        let delta_y = child_height;

        // Calculate spare pixels
        // The floor operation we do above may lead us to have 1,2 spare pixels
        let spare_pixels = alloc.height - (child_height * this._support_cards_shown);

        // Featured card:
        // Place the featured card at the left hand side of the arrangement
        // FIXME: For now, we show the first-added card as the featured card.
        // This should change to have a model with the featured flag added in
        // this spot, but for that we'd need the arrangement interface to
        // receive a model, instead of a widget in the "add" method.
        let featured_card = all_cards[0];
        Arrangement.place_card(featured_card, alloc.x, alloc.y, featured_width, featured_height);

        let x = alloc.x + featured_width;
        let y = alloc.y;

        // Support cards:
        // Place support cards in a column to the right of the featured card
        all_cards.slice(1, this._support_cards_shown + 1).forEach((card, i) => {
            Arrangement.place_card(card, x, y, child_width, child_height);

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

        if (width < CARD_WIDTH_BIG * HORIZONTAL_PROPORTION) {
            return this._support_card_count - 1;
        } else {
            return this._support_card_count;
        }
    },
});

/**
 * Class: Piano
 * Arrangement with featured card on prominent spot and three supporting cards
 *
 * This arrangement shows a featured card in a very prominent spot, followed by
 * three secondary cards at its right side.
 */
var Piano = new Module.Class({
    Name: 'Arrangement.Piano',
    Extends: Gtk.Grid,
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
        this._layout = new _PianoLayout({
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

    // Arrangement override
    pack_card: function (card) {
        this._layout.add(card);
    },

    // Arrangement override
    unpack_card: function (card) {
        this._layout.remove(card);
    },

    get compact_mode() {
        return this._layout.compact_mode;
    },

    set compact_mode(value) {
        if (this._layout.compact_mode === value)
            return;
        this._layout.compact_mode = value;
        this.notify('compact-mode');
    },

    get all_visible() {
        return this._layout.all_visible;
    },

    get_max_cards: function () {
        return DEFAULT_SUPPORT_CARD_COUNT + 1;
    },
});
