// Copyright 2016 Endless Mobile, Inc.

/* exported ThirtiesArrangement */

const Endless = imports.gi.Endless;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const CARD_HEIGHT_SMALL = Card.MinSize.A;
const CARD_HEIGHT_BIG = Card.MinSize.B;
const CARD_HEIGHT_THRESHOLD = Card.MinSize.C;
const CARD_WIDTH_SMALL = Card.MinSize.B;
const CARD_WIDTH_BIG = Card.MinSize.H;
const COL_COUNT = 3;

/**
 * Class: ThirtiesArrangement
 */
const ThirtiesArrangement = new Lang.Class({
    Name: 'ThirtiesArrangement',
    GTypeName: 'EknThirtiesArrangement',
    Extends: Endless.CustomContainer,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'all-visible': GObject.ParamSpec.override('all-visible', Arrangement.Arrangement),
        'fade-cards': GObject.ParamSpec.override('fade-cards', Arrangement.Arrangement),
        'spacing': GObject.ParamSpec.override('spacing', Arrangement.Arrangement),
        /**
         * Property: max-rows
         * Maximum number of card rows to be displayed
         *
         * A value of zero means no maximum.
         *
         * Default:
         *   0
         */
        'max-rows': GObject.ParamSpec.uint('max-rows', 'Maximum rows',
            'The maximum number of card rows to be displayed.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT16, 0),
    },

    _init: function (props={}) {
        this._max_rows = 0;
        this._spacing = 0;

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

    get max_rows() {
        return this._max_rows;
    },

    set max_rows(v) {
        if (this._max_rows === v)
            return;
        this._max_rows = v;
        this.notify('max-rows');
        this.queue_resize();
    },

    get all_visible() {
        return this.get_card_count() <= COL_COUNT * this._max_rows;
    },

    get_max_cards: function () {
        return COL_COUNT * this._max_rows;
    },

    // Arrangement override
    fade_card_in: function (card) {
        if (this._max_rows === 0)
            Arrangement.Arrangement.fade_card_in(this, card);
        else
            card.show_all();
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        return [Arrangement.get_size_with_spacing(CARD_WIDTH_SMALL, COL_COUNT, this._spacing),
            Arrangement.get_size_with_spacing(CARD_WIDTH_BIG, COL_COUNT, this._spacing)];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        let card_height = this._get_card_height(width);
        let rows_for_children = Math.ceil(this.get_card_count() / COL_COUNT);
        let rows_visible = this._max_rows === 0 ? rows_for_children : Math.min(this._max_rows, rows_for_children);
        let height = Arrangement.get_size_with_spacing(card_height, rows_visible, this._spacing);
        return [height, height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let count = this.get_card_count();
        if (count === 0)
            return;

        let visible_children_count = this._max_rows === 0 ? count :
            Math.min(count, this._max_rows  * COL_COUNT);

        let available_width = alloc.width - ((COL_COUNT - 1) * this._spacing);
        let child_width = Math.floor(available_width / COL_COUNT);
        let child_height = this._get_card_height(alloc.width);
        let delta_x = child_width + this._spacing;
        let delta_y = child_height + this._spacing;

        // Calculate spare pixels
        // The floor operation we do above may lead us to have 1,2 spare pixels
        let spare_pixels = alloc.width - (Arrangement.get_size_with_spacing(child_width, COL_COUNT, this._spacing));

        let x = alloc.x;
        let y = alloc.y;

        let all_cards = this.get_filtered_models()
            .map(this.get_card_for_model, this);
        all_cards.slice(0, visible_children_count).forEach((card, i) => {
            this.place_card(card, x, y, child_width, child_height);

            if ((i + 1) % COL_COUNT === 0) {
                x = alloc.x;
                y += delta_y;
            } else {
                let sp = Arrangement.get_spare_pixels_for_card_index(spare_pixels, COL_COUNT, i);
                x += delta_x + sp;
            }
        });

        // Additional cards should not be visible!
        all_cards.slice(visible_children_count, count).forEach((card) => {
            card.set_child_visible(false);
        });

        Utils.set_container_clip(this);
    },

    // Removing a visible widget should recalculate the positions of all widgets
    vfunc_remove: function (widget) {
        let needs_resize = widget.get_child_visible();
        this.parent(widget);
        if (needs_resize)
            this.queue_resize();
    },

    _get_card_height: function (width) {
        let small_mode = (width < Arrangement.get_size_with_spacing(CARD_HEIGHT_THRESHOLD, COL_COUNT, this._spacing));
        return small_mode ? CARD_HEIGHT_SMALL : CARD_HEIGHT_BIG;
    },
});
