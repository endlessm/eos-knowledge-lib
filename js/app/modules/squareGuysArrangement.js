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

const COL_COUNT_MAX = 4;
const COL_COUNT_MIN = 3;
const ROW_COUNT = 2;
const CARD_SIZE_SMALL = Card.MinSize.B;
const CARD_SIZE_BIG = Card.MinSize.C;
const CARD_SIZE_MAX = Card.MaxSize.C;
const NUM_SHOWN_MAX = COL_COUNT_MAX * ROW_COUNT;
const NUM_SHOWN_MIN = COL_COUNT_MIN * ROW_COUNT;

const SquareGuysArrangement = new Lang.Class({
    Name: 'SquareGuysArrangement',
    GTypeName: 'EknSquareGuysArrangement',
    Extends: Endless.CustomContainer,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        /**
         * Property: spacing
         * The amount of space in pixels between children cards
         *
         * Default:
         *   0
         */
        'spacing': GObject.ParamSpec.uint('spacing', 'Spacing',
            'The amount of space in pixels between children cards',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXUINT16, 0),
    },

    _init: function (props={}) {
        this._spacing = 0;
        this.parent(props);

        this._small_mode = false;
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

    vfunc_get_preferred_width: function () {
        return [this._get_size_with_spacing(CARD_SIZE_SMALL, COL_COUNT_MIN),
            this._get_size_with_spacing(CARD_SIZE_MAX, COL_COUNT_MAX)];
    },

    vfunc_get_preferred_height: function () {
        let card_size = this._small_mode ? CARD_SIZE_SMALL : CARD_SIZE_BIG;
        let height = this._get_size_with_spacing(card_size, ROW_COUNT);
        return [height, height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        this._small_mode = (alloc.width < this._get_size_with_spacing(CARD_SIZE_BIG, COL_COUNT_MIN));
        let three_column_mode = (alloc.width < this._get_size_with_spacing(CARD_SIZE_BIG, COL_COUNT_MAX));

        let col_count = three_column_mode ? COL_COUNT_MIN : COL_COUNT_MAX;

        let available_width = alloc.width - (this._spacing * (col_count - 1));
        let available_height = alloc.height - this._spacing;

        // Cards width and height cannot be larger than the max sizes of the cards
        let child_width = Math.min(Math.floor(available_width / (col_count)), CARD_SIZE_MAX);
        let child_height = Math.min(Math.floor(available_height / ROW_COUNT), this._small_mode ? CARD_SIZE_SMALL : CARD_SIZE_BIG);
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
        let num_shown_children = three_column_mode ? NUM_SHOWN_MIN : NUM_SHOWN_MAX;
        this.get_children().forEach((child, ix) => {
            if (ix >= num_shown_children) {
                child.set_child_visible(false);
                return;
            }

            child.set_child_visible(true);
            let child_alloc = new Cairo.RectangleInt({
                x: x,
                y: y,
                width: child_width,
                height: child_height,
            });
            child.size_allocate(child_alloc);
            if (ix % ROW_COUNT == 1) {
                x += delta_x;
                y = alloc.y;
            } else {
                y += delta_y;
            }
        });
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

    _get_size_with_spacing: function (size, count) {
        return size * count + this._spacing * (count - 1);
    },
});
