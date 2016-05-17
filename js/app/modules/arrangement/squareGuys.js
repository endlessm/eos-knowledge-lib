// Copyright 2015 Endless Mobile, Inc.

/* exported SquareGuys */

const Endless = imports.gi.Endless;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const Knowledge = imports.app.knowledge;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const COL_COUNT_MAX = 4;
const COL_COUNT_MIN = 3;
const CARD_SIZE_SMALL = Card.MinSize.B;
const CARD_SIZE_BIG = Card.MinSize.C;
const CARD_SIZE_MAX = Card.MaxSize.C;

const _SquareGuysLayout = new Knowledge.Class({
    Name: 'SquareGuysArrangementLayout',
    Extends: Endless.CustomContainer,

    _init: function (props={}) {
        this.spacing = 0;
        this.max_rows = 0;
        this.parent(props);

        this._small_mode = false;
        this._three_column_mode = false;
    },

    // Removing a widget should recalculate the positions of all widgets
    vfunc_remove: function (widget) {
        this.parent(widget);
        this.queue_resize();
    },

    vfunc_get_preferred_width: function () {
        return [Arrangement.get_size_with_spacing(CARD_SIZE_SMALL, COL_COUNT_MIN, this.spacing),
            Arrangement.get_size_with_spacing(CARD_SIZE_MAX, COL_COUNT_MAX, this.spacing)];
    },

    vfunc_get_preferred_height: function () {
        let card_size = this._small_mode ? CARD_SIZE_SMALL : CARD_SIZE_BIG;
        let rows_for_children = Math.ceil(this.get_children().length / this._get_columns_per_row());
        let rows_visible = this.max_rows === 0 ? rows_for_children : Math.min(this.max_rows, rows_for_children);
        let height = Arrangement.get_size_with_spacing(card_size, rows_visible, this.spacing);
        return [height, height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        this._small_mode = (alloc.width < Arrangement.get_size_with_spacing(CARD_SIZE_BIG, COL_COUNT_MIN, this.spacing));
        this._three_column_mode = (alloc.width < Arrangement.get_size_with_spacing(CARD_SIZE_BIG, COL_COUNT_MAX, this.spacing));

        let col_count = this._get_columns_per_row();

        let available_width = alloc.width - (this.spacing * (col_count - 1));

        // Cards width and height cannot be larger than the max sizes of the cards
        let child_width = Math.min(Math.floor(available_width / (col_count)), CARD_SIZE_MAX);
        let child_height = Math.min(this._small_mode ? CARD_SIZE_SMALL : CARD_SIZE_BIG);
        let x = alloc.x;
        let y = alloc.y;
        let delta_x = child_width + this.spacing;
        let delta_y = child_height + this.spacing;

        let extra_arrangement_space = alloc.width - Arrangement.get_size_with_spacing(CARD_SIZE_MAX, COL_COUNT_MAX, this.spacing);
        if (extra_arrangement_space > 0) {
            // If we get extra card spacing, we pad the cards horizontally, increasing the delta_x
            let extra_card_spacing = Math.floor(extra_arrangement_space / (col_count - 1));
            delta_x += extra_card_spacing;
        }

        let all_children = this.get_parent().get_cards();
        let visible_children_count = this.max_rows === 0 ? all_children.length :
            Math.min(all_children.length, this.max_rows  * col_count);

        all_children.slice(0, visible_children_count).forEach((card, ix) => {
            Arrangement.place_card(card, x, y, child_width, child_height);

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

    _get_columns_per_row: function () {
        return this._three_column_mode ? COL_COUNT_MIN : COL_COUNT_MAX;
    }
});

/**
 * Class: SquareGuys
 */
const SquareGuys = new Module.Class({
    Name: 'SquareGuysArrangement',
    CssName: 'EknSquareGuysArrangement',
    Extends: Gtk.Grid,
    Implements: [Arrangement.Arrangement],

    Properties: {
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
        this._layout = new _SquareGuysLayout({
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
        if (this.max_rows === 0)
            return -1;
        return COL_COUNT_MAX * this.max_rows;
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

    get max_rows() {
        return this._layout.max_rows;
    },

    set max_rows(value) {
        if (this._layout.max_rows === value)
            return;
        this._layout.max_rows = value;
        this.notify('max-rows');
        this._layout.queue_resize();
    },
});
