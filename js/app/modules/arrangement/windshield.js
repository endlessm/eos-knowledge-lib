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
    Name: 'WindshieldLayout',
    CssName: 'EknWindshieldArrangement',
    Extends: Endless.CustomContainer,

    _init: function (props={}) {
        this._small_mode = false;
        this.spacing = 0;

        this.parent(props);
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
        return [Arrangement.get_size_with_spacing(CARD_SIZE_SMALL, SECOND_ROW_CARD_COUNT, this.spacing),
            Arrangement.get_size_with_spacing(CARD_SIZE_MAX, SECOND_ROW_CARD_COUNT, this.spacing)];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        this._small_mode = (width < Arrangement.get_size_with_spacing(CARD_SIZE_BIG, SECOND_ROW_CARD_COUNT, this.spacing));
        let card_size = CARD_SIZE_SMALL * (this._small_mode ? SECOND_ROW_CARD_COUNT - 1 : SECOND_ROW_CARD_COUNT);
        let height = card_size + this.spacing;
        return [height, height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let count = this.get_children().length;
        if (count === 0)
            return;

        let all_cards = this.get_parent().get_cards();

        this._small_mode = (alloc.width < Arrangement.get_size_with_spacing(CARD_SIZE_BIG, SECOND_ROW_CARD_COUNT, this.spacing));

        let available_width = alloc.width - ((SECOND_ROW_CARD_COUNT - 1) * this.spacing);
        let available_height = alloc.height - this.spacing;

        let featured_height_factor = this._small_mode ? 0.5 : 2 / 3;
        let featured_height = Math.floor(available_height * featured_height_factor);
        let child_width = Math.floor(available_width / SECOND_ROW_CARD_COUNT);
        let child_height = Math.floor(available_height * (1 - featured_height_factor));
        let delta_x = child_width + this.spacing;

        // Calculate spare pixels
        // The floor operation we do above may lead us to have 1,2 spare pixels
        let spare_pixels = alloc.width - (Arrangement.get_size_with_spacing(child_width, SECOND_ROW_CARD_COUNT, this.spacing));

        // Featured card:
        // Place the featured card at the at top of the arrangement
        // FIXME: For now, we show the first-added card as the featured card.
        // This should change to have a model with the featured flag added in
        // this spot, but for that we'd need the arrangement interface to
        // receive a model, instead of a widget in the "add" method.
        let featured_card = all_cards[0];
        Arrangement.place_card(featured_card, alloc.x, alloc.y, alloc.width, featured_height);

        let x = alloc.x;
        let y = alloc.y + featured_height + this.spacing;

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
    CssName: 'EknWindshieldArrangement',
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

    get spacing() {
        return this._layout.spacing;
    },

    set spacing(value) {
        if (this._layout.spacing === value)
            return;
        this._layout.spacing = value;
        this.notify('spacing');
        this._layout.queue_resize();
    },
});
