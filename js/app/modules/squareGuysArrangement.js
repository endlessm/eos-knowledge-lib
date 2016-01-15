// Copyright 2015 Endless Mobile, Inc.

/* exported SquareGuysArrangement */

const Cairo = imports.gi.cairo;
const Endless = imports.gi.Endless;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const COL_COUNT_MAX = 4;
const COL_COUNT_MIN = 3;
const CARD_SIZE_SMALL = Card.MinSize.B;
const CARD_SIZE_BIG = Card.MinSize.C;
const CARD_SIZE_MAX = Card.MaxSize.C;

const SquareGuysArrangement = new Lang.Class({
    Name: 'SquareGuysArrangement',
    GTypeName: 'EknSquareGuysArrangement',
    Extends: Endless.CustomContainer,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'all-visible': GObject.ParamSpec.override('all-visible', Arrangement.Arrangement),
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
        this._spacing = 0;
        this._max_rows = 0;
        this.parent(props);

        this._small_mode = false;
        this._three_column_mode = false;
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

    get_max_cards: function () {
        if (this.max_rows === 0)
            return -1;
        return COL_COUNT_MAX * this.max_rows;
    },

    vfunc_get_preferred_width: function () {
        return [this._get_size_with_spacing(CARD_SIZE_SMALL, COL_COUNT_MIN),
            this._get_size_with_spacing(CARD_SIZE_MAX, COL_COUNT_MAX)];
    },

    vfunc_get_preferred_height: function () {
        let card_size = this._small_mode ? CARD_SIZE_SMALL : CARD_SIZE_BIG;
        let rows_for_children = Math.ceil(this.get_children().length / this._get_columns_per_row());
        let rows_visible = this._max_rows === 0 ? rows_for_children : Math.min(this._max_rows, rows_for_children);
        let height = this._get_size_with_spacing(card_size, rows_visible);
        return [height, height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        this._small_mode = (alloc.width < this._get_size_with_spacing(CARD_SIZE_BIG, COL_COUNT_MIN));
        this._three_column_mode = (alloc.width < this._get_size_with_spacing(CARD_SIZE_BIG, COL_COUNT_MAX));

        let col_count = this._get_columns_per_row();

        let available_width = alloc.width - (this._spacing * (col_count - 1));

        // Cards width and height cannot be larger than the max sizes of the cards
        let child_width = Math.min(Math.floor(available_width / (col_count)), CARD_SIZE_MAX);
        let child_height = Math.min(this._small_mode ? CARD_SIZE_SMALL : CARD_SIZE_BIG);
        let x = alloc.x;
        let y = alloc.y;
        let delta_x = child_width + this._spacing;
        let delta_y = child_height + this._spacing;

        let extra_arrangement_space = alloc.width - this._get_size_with_spacing(CARD_SIZE_MAX, COL_COUNT_MAX);
        if (extra_arrangement_space > 0) {
            // If we get extra card spacing, we pad the cards horizontally, increasing the delta_x
            let extra_card_spacing = Math.floor(extra_arrangement_space / (col_count - 1));
            delta_x += extra_card_spacing;
        }

        let all_children = this.get_children();
        let visible_children_count = this._max_rows === 0 ? all_children.length :
            Math.min(all_children.length, this._max_rows  * col_count);

        all_children.slice(0, visible_children_count).forEach((card, ix) => {
            card.set_child_visible(true);
            let child_alloc = new Cairo.RectangleInt({
                x: x,
                y: y,
                width: child_width,
                height: child_height,
            });
            card.size_allocate(child_alloc);
            if ((ix + 1) % col_count === 0) {
                x = alloc.x;
                y += delta_y;
            } else {
                x += delta_x;
            }
        });

        all_children.slice(visible_children_count, all_children.length).forEach((card) => {
            card.set_child_visible(false);
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

    get max_rows() {
        return this._max_rows;
    },

    set max_rows(value) {
        if (this._max_rows === value)
            return;
        this._max_rows = value;
        this.notify('max-rows');
    },

    _get_size_with_spacing: function (size, count) {
        return size * count + this._spacing * (count - 1);
    },

    _get_columns_per_row: function () {
        return this._three_column_mode ? COL_COUNT_MIN : COL_COUNT_MAX;
    }
});
