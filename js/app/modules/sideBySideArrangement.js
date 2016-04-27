// Copyright (C) 2016 Endless Mobile, Inc.

/* exported SideBySideArrangement */

const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const Module = imports.app.interfaces.module;

const MENU_HEIGHT = 50;
const _HorizontalSpacing = {
    TINY: 15,
    SMALL: 20,
    LARGE: 40,
    XLARGE: 50,
};
/**
 * Class: SideBySideArrangement
 * Arrangement to be used in horizontal menus
 *
 * This arrangement presents cards in a horizontal layout, and is intended to
 * display menu items.
 */
const SideBySideArrangement = new Module.Class({
    Name: 'SideBySideArrangement',
    CssName: 'EknSideBySideArrangement',
    Extends: Endless.CustomContainer,
    Implements: [Arrangement.Arrangement],

    _init: function (props={}) {
        this._all_visible = true;

        this.parent(props);
    },

    get all_visible() {
        return this._all_visible;
    },

    // Removing a visible widget should recalculate the positions of all widgets
    vfunc_remove: function (widget) {
        let needs_resize = widget.get_child_visible();
        this.parent(widget);
        if (needs_resize)
            this.queue_resize();
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.CONSTANT_SIZE;
    },

    vfunc_get_preferred_height: function () {
        if (this.get_filtered_models().length === 0)
            return [0, 0];

        return [MENU_HEIGHT, MENU_HEIGHT];
    },

    vfunc_get_preferred_width: function () {
        let filtered_models = this.get_filtered_models();
        if (filtered_models.length === 0)
            return [0, 0];

        let all_cards = filtered_models.map((model) => this.get_card_for_model(model));
        let [min, nat] = all_cards[0].get_preferred_width();

        nat += all_cards.slice(1).reduce((accum, card) => {
            let [, card_nat] = card.get_preferred_width();
            return accum + card_nat;
        }, 0);

        nat += _HorizontalSpacing.XLARGE * (all_cards.length - 1);
        return [min, nat];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        this._all_visible = true;

        if (this.get_card_count() === 0)
            return;

        let all_cards = this.get_filtered_models().map((model) => this.get_card_for_model(model));

        let cards_width = all_cards.reduce((accum, card) => {
            let [, card_nat] = card.get_preferred_width();
            return accum + card_nat;
        }, 0);

        let leftover = (alloc.width - cards_width) / (all_cards.length - 1)
        let spacing = this._get_horizontal_spacing(leftover);
        let available_width = alloc.width;
        let x = alloc.x;
        let y = alloc.y;

        all_cards.forEach((card) => {
            let [, card_nat] = card.get_preferred_width();
            if (card_nat <= available_width) {
                let offset = card_nat + spacing;
                this.place_card(card, x, y, card_nat, MENU_HEIGHT);
                available_width -= offset;
                x += offset;
            } else {
                this._all_visible = false;
                card.set_child_visible(false);
            }
        });
    },

    _get_horizontal_spacing: function (width) {
        let spacing;
        if (width < _HorizontalSpacing.TINY) {
            spacing = 0;
        } else if (width < _HorizontalSpacing.SMALL) {
            spacing = _HorizontalSpacing.TINY;
        } else if (width < _HorizontalSpacing.LARGE) {
            spacing = _HorizontalSpacing.SMALL;
        } else if (width < _HorizontalSpacing.XLARGE) {
            spacing = _HorizontalSpacing.LARGE;
        } else {
            spacing = _HorizontalSpacing.XLARGE;
        }
        return spacing;
    },
});
