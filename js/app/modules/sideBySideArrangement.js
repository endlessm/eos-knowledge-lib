// Copyright 2016 Endless Mobile, Inc.

/* exported SideBySideArrangement */

const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;

const MENU_HEIGHT = 50;
const MAX_CARDS = 8;
const _HorizontalThreshold = {
    TINY: 720,
    SMALL: 900,
    LARGE: 1200,
};
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
const SideBySideArrangement = new Lang.Class({
    Name: 'SideBySideArrangement',
    GTypeName: 'EknSideBySideArrangement',
    Extends: Endless.CustomContainer,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'all-visible': GObject.ParamSpec.override('all-visible', Arrangement.Arrangement),
        'spacing': GObject.ParamSpec.override('spacing', Arrangement.Arrangement),
    },

    _init: function (props={}) {
        this._horizontal_threshold = _HorizontalThreshold.LARGE;
        this._all_visible = true;

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
        return [MENU_HEIGHT, MENU_HEIGHT];
    },

    vfunc_get_preferred_width: function () {
        return [0, MAX_CARDS * Card.MinSize.H];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        this._all_visible = true;
        let all_cards = this.get_children();

        if (all_cards.length === 0)
            return;

        let spacing = this._get_horizontal_spacing(alloc.width);
        let available_width = alloc.width;
        let x = alloc.x;
        let y = alloc.y;

        all_cards.forEach((card) => {
            let [card_min, card_nat] = card.get_preferred_width();
            if (card_nat < available_width) {
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
        if (width <= _HorizontalThreshold.TINY) {
            spacing = _HorizontalSpacing.TINY;
        } else if (width <= _HorizontalThreshold.SMALL) {
            spacing = _HorizontalSpacing.SMALL;
        } else if (width <= _HorizontalThreshold.LARGE) {
            spacing = _HorizontalSpacing.LARGE;
        } else {
            spacing = _HorizontalSpacing.XLARGE;
        }
        return spacing;
    },
});
