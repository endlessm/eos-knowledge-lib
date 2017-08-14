// Copyright 2016 Endless Mobile, Inc.

/* exported Quilt */

const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const Knowledge = imports.app.knowledge;
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

const CARD_COUNT_LG = 4;
const CARD_COUNT_SM = 2;

const _QuiltLayout = new Knowledge.Class({
    Name: 'Arrangement.QuiltLayout',
    Extends: Endless.CustomContainer,

    _init: function (props={}) {
        this.total_cards_to_show = CARD_COUNT_LG;

        this.parent(props);
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        return [_PrimaryCard.Width.TINY + _SecondaryCard.Width.TINY, CARD_COUNT_LG * Card.MinSize.H];
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

        let parent = this.get_parent();
        let count = parent.get_count();
        if (count === 0)
            return;

        let all_cards = parent.get_models()
            .map(parent.get_card_for_model, parent)
            .filter(card => card);

        let [horizontal_mode, total_cards_to_show] = this._determine_horizontal_mode(alloc.width);
        this.total_cards_to_show = total_cards_to_show;

        let x = alloc.x;
        let y = alloc.y;

        let primary_width = Math.floor(alloc.width * PRIMARY_HORIZONTAL_PROPORTION[horizontal_mode]);
        let secondary_width = Math.floor(alloc.width * SECONDARY_HORIZONTAL_PROPORTION[horizontal_mode]);
        let support_width = alloc.width - primary_width - secondary_width;

        // Place primary card
        Arrangement.place_card(all_cards[0], x, y, primary_width, _PrimaryCard.Height[horizontal_mode]);
        x += primary_width;

        if (count === 1)
            return;

        // Place secondary card
        Arrangement.place_card(all_cards[1], x, y, secondary_width, _SecondaryCard.Height[horizontal_mode]);
        x += secondary_width;

        let invisible_cards_offset = CARD_COUNT_LG;
        // Place support cards, if needed
        if (horizontal_mode === _HorizontalMode.LARGE) {
            all_cards.slice(2, CARD_COUNT_LG).forEach((card) => {
                Arrangement.place_card(card, x, y, support_width, _SupportCards.HEIGHT);
                y += _SupportCards.HEIGHT;
            });
        } else {
            invisible_cards_offset = CARD_COUNT_SM;
        }

        all_cards.slice(invisible_cards_offset).forEach((card) => {
            card.set_child_visible(false);
        });

        Utils.set_container_clip(this);
    },

    _determine_horizontal_mode: function (width) {
        let horizontal_mode;
        let total_cards_to_show = CARD_COUNT_SM;
        if (width < _HorizontalThreshold.TINY) {
            horizontal_mode = _HorizontalMode.TINY;
        } else if (width < _HorizontalThreshold.SMALL) {
            horizontal_mode = _HorizontalMode.SMALL;
        } else {
            horizontal_mode = _HorizontalMode.LARGE;
            total_cards_to_show = CARD_COUNT_LG;
        }
        return [horizontal_mode, total_cards_to_show];
    },
});

/**
 * Class: Quilt
 * Arrangement with primary card and secondary card on prominent spots, and two
 * support cards if enough width.
 *
 * The arrangement shows a primary card in the leftmost space, followed by a
 * secondary card that is placed vertically next to the primary card. If width
 * is enough, a third column with two support cards is shown.
 */
var Quilt = new Module.Class({
    Name: 'Arrangement.Quilt',
    Extends: Gtk.Grid,
    Implements: [Arrangement.Arrangement],

    _init: function (props={}) {
        this._layout = new _QuiltLayout({
            visible: true,
            expand: true,
        });
        this.parent(props);

        this.add(this._layout);
    },

    // Arrangement implementation
    get_max_cards: function () {
        return CARD_COUNT_LG;
    },

    // Arrangement override
    pack_card: function (card) {
        this._layout.add(card);
    },

    // Arrangement override
    unpack_card: function (card) {
        this._layout.remove(card);
    },

    get all_visible() {
        return this.get_count() <= this._layout.total_cards_to_show;
    },
});
