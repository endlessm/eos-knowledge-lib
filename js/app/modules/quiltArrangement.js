// Copyright (C) 2016 Endless Mobile, Inc.

/* exported QuiltArrangement */

const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const _HorizontalMode = {
    TINY: "TINY",
    SMALL: "SMALL",
    LARGE: "LARGE",
};
const _HorizontalThreshold = {
    TINY: 1000,
    SMALL: 1200,
};
const _PrimaryCard = {
    Width: {
        TINY: Card.MinSize.C,
        SMALL: Card.MinSize.E,
        LARGE: Card.MinSize.E,
    },
    Height: {
        TINY: Card.MinSize.C,
        SMALL: Card.MinSize.D,
        LARGE: Card.MinSize.D,
    }
};
const _SecondaryCard = {
    Width: {
        TINY: Card.MinSize.B,
        SMALL: Card.MinSize.C,
        LARGE: Card.MinSize.C,
    },
    Height: {
        TINY: Card.MinSize.C,
        SMALL: Card.MinSize.D,
        LARGE: Card.MinSize.D,
    }
};
const _SupportCards = {
    Width: {
        TINY: Card.MinSize.B,
        SMALL: Card.MinSize.C,
        LARGE: Card.MinSize.C,
    },
    HEIGHT: Card.MinSize.B
};
/*
 * In the following constants, the divisor represents the number of total "units"
 * in the arrangement.
 * The dividend represents the units taken by the corresponding card.
 */
const PRIMARY_HORIZONTAL_PROPORTION = {
    TINY: 4 / 7,
    SMALL: 6 / 9,
    LARGE: 6 / 12,
};
const SECONDARY_HORIZONTAL_PROPORTION = {
    TINY: 3 / 7,
    SMALL: 3 / 9,
    LARGE: 3 / 12,
};

/**
 * Class: QuiltArrangement
 * Arrangement with primary card and secondary card on prominent spots, and two
 * support cards if enough width.
 *
 * The arrangement shows a primary card in the leftmost space, followed by a
 * secondary card that is placed vertically next to the primary card. If width
 * is enough, a third column with two support cards is shown.
 */
const QuiltArrangement = new Module.Class({
    Name: 'QuiltArrangement',
    CssName: 'EknQuiltArrangement',
    Extends: Endless.CustomContainer,
    Implements: [Arrangement.Arrangement],

    _init: function (props={}) {
        this._spacing = 0;
        this._total_cards_to_show = 4;

        this.parent(props);
    },

    get spacing() {
        return this._spacing;
    },

    set spacing(v) {
        if (this._spacing === v)
            return;
        this._spacing = v;
        this.notify('spacing');
        this.queue_resize();
    },

    get all_visible() {
        return this.get_card_count() <= this._total_cards_to_show;
    },

    get_max_cards: function () {
        return this._total_cards_to_show;
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
        return [_PrimaryCard.Width.TINY + _SecondaryCard.Width.TINY + this._spacing,
            Arrangement.get_size_with_spacing(Card.MinSize.H, 4, this._spacing)];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        let [horizontal_mode, total_cards_to_show] = this._determine_horizontal_mode(width);
        if (horizontal_mode === _HorizontalMode.TINY)
            return [_PrimaryCard.Height.TINY, _PrimaryCard.Height.TINY];
        else
            return [_PrimaryCard.Height.LARGE, _PrimaryCard.Height.LARGE];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let count = this.get_card_count();
        if (count === 0)
            return;

        let all_cards = this.get_filtered_models()
            .map(this.get_card_for_model, this);

        let [horizontal_mode, total_cards_to_show] = this._determine_horizontal_mode(alloc.width);
        this._total_cards_to_show = total_cards_to_show;

        let x = alloc.x;
        let y = alloc.y;

        let available_width = alloc.width - this._spacing;
        if (horizontal_mode === _HorizontalMode.LARGE)
            available_width -= this._spacing;  // Additional spacing before third column

        let primary_width = Math.floor(available_width * PRIMARY_HORIZONTAL_PROPORTION[horizontal_mode]);
        let secondary_width = Math.floor(available_width * SECONDARY_HORIZONTAL_PROPORTION[horizontal_mode]);
        let support_width = available_width - primary_width - secondary_width;

        // Place primary card
        this.place_card(all_cards[0], x, y, primary_width, _PrimaryCard.Height[horizontal_mode] + this._spacing);
        x += primary_width + this._spacing;

        if (count === 1)
            return;

        // Place secondary card
        this.place_card(all_cards[1], x, y, secondary_width, _SecondaryCard.Height[horizontal_mode] + this._spacing);
        x += secondary_width + this._spacing;

        let invisible_cards_offset = 4;
        // Place support cards, if needed
        if (horizontal_mode === _HorizontalMode.LARGE) {
            all_cards.slice(2, 4).forEach((card) => {
                this.place_card(card, x, y, support_width, _SupportCards.HEIGHT);
                y += _SupportCards.HEIGHT + this._spacing;
            });
        } else {
            invisible_cards_offset = 2;
        }

        all_cards.slice(invisible_cards_offset).forEach((card) => {
            card.set_child_visible(false);
        });

        Utils.set_container_clip(this);
    },

    _determine_horizontal_mode: function (width) {
        let horizontal_mode;
        let total_cards_to_show = 2;
        if (width < _HorizontalThreshold.TINY) {
            horizontal_mode = _HorizontalMode.TINY;
        } else if (width < _HorizontalThreshold.SMALL) {
            horizontal_mode = _HorizontalMode.SMALL;
        } else {
            horizontal_mode = _HorizontalMode.LARGE;
            total_cards_to_show = 4;
        }
        return [horizontal_mode, total_cards_to_show];
    },
});
