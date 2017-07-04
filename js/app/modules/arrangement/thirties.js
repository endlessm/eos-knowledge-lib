
// Copyright 2016 Endless Mobile, Inc.

/* exported Thirties */

const Endless = imports.gi.Endless;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const Knowledge = imports.app.knowledge;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const CARD_HEIGHT_SMALL = Card.MinSize.B;
const CARD_HEIGHT_BIG = Card.MinSize.C;
const CARD_WIDTH_THRESHOLD = Card.MinSize.C;
const CARD_WIDTH_SMALL = Card.MinSize.B;
const CARD_WIDTH_BIG = Card.MinSize.H;
const COL_COUNT = 3;

const _ThirtiesLayout = new Knowledge.Class({
    Name: 'Arrangement.ThirtiesLayout',
    Extends: Endless.CustomContainer,

    _init: function (props={}) {
        this.max_rows = 0;

        this.parent(props);
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        return [CARD_WIDTH_SMALL * COL_COUNT, CARD_WIDTH_BIG * COL_COUNT];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        let card_height = this._get_card_height(width);
        let rows_for_children = Math.ceil(this.get_children().length / COL_COUNT);
        let rows_visible = this.max_rows === 0 ? rows_for_children : Math.min(this.max_rows, rows_for_children);
        let height = card_height * rows_visible;
        return [height, height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let count = this.get_children().length;
        if (count === 0)
            return;

        let visible_children_count = this.max_rows === 0 ? count :
            Math.min(count, this.max_rows  * COL_COUNT);

        let child_width = Math.floor(alloc.width / COL_COUNT);
        let child_height = this._get_card_height(alloc.width);
        let delta_x = child_width;
        let delta_y = child_height;

        // Calculate spare pixels
        // The floor operation we do above may lead us to have 1,2 spare pixels
        let spare_pixels = alloc.width - (child_width * COL_COUNT);

        let x = alloc.x;
        let y = alloc.y;

        let all_cards = this.get_parent().get_cards();
        all_cards.slice(0, visible_children_count).forEach((card, i) => {
            Arrangement.place_card(card, x, y, child_width, child_height);

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
        let small_mode = (width < CARD_WIDTH_THRESHOLD * COL_COUNT);
        return small_mode ? CARD_HEIGHT_SMALL : CARD_HEIGHT_BIG;
    },
});

/**
 * Class: Thirties
 */
var Thirties = new Module.Class({
    Name: 'Arrangement.Thirties',
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
        this._layout = new _ThirtiesLayout({
            visible: true,
            expand: true,
        });
        this.parent(props);

        this.add(this._layout);
    },

    // Arrangement override
    fade_card_in: function (card) {
        if (this.max_rows === 0)
            Arrangement.Arrangement.fade_card_in(this, card);
        else
            card.show_all();
    },

    // Arrangement implementation
    get_max_cards: function () {
        if (this.max_rows === 0)
            return -1;
        return COL_COUNT * this.max_rows;
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
        if (this.max_rows === 0)
            return true;
        return this.get_card_count() <= COL_COUNT * this.max_rows;
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
