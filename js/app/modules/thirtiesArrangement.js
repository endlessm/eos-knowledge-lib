// Copyright 2016 Endless Mobile, Inc.

/* exported ThirtiesArrangement */

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
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

const ThirtiesArrangement = new Lang.Class({
    Name: 'ThirtiesArrangement',
    GTypeName: 'EknThirtiesArrangement',
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
        this._max_rows = 0;
        this._spacing = 0;
        this._small_mode = false;

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
        return this.get_children().length <= COL_COUNT * this._max_rows;
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        return [this._get_size_with_spacing(CARD_WIDTH_SMALL, COL_COUNT),
            this._get_size_with_spacing(CARD_WIDTH_BIG, COL_COUNT)];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        this._small_mode = (width < this._get_size_with_spacing(CARD_HEIGHT_THRESHOLD, COL_COUNT));

        let card_height = this._small_mode ? CARD_HEIGHT_SMALL : CARD_HEIGHT_BIG;
        let rows_for_children = Math.ceil(this.get_children().length / COL_COUNT);
        let rows_visible = this._max_rows === 0 ? rows_for_children : Math.min(this._max_rows, rows_for_children);
        let height = this._get_size_with_spacing(card_height, rows_visible);
        return [height, height];
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        let all_children = this.get_children();

        // If arrangement has no child cards yet, simply exit
        if (all_children.length === 0)
            return;

        let visible_children_count = this._max_rows === 0 ? all_children.length :
            Math.min(all_children.length, this._max_rows  * COL_COUNT);

        let available_width = alloc.width - ((COL_COUNT - 1) * this._spacing);
        let child_width = Math.floor(available_width / COL_COUNT);
        let child_height = this._small_mode ? CARD_HEIGHT_SMALL : CARD_HEIGHT_BIG;
        let delta_x = child_width + this._spacing;
        let delta_y = child_height + this._spacing;

        // Calculate spare pixels
        // The floor operation we do above may lead us to have 1,2 spare pixels
        let spare_pixels = alloc.width - (this._get_size_with_spacing(child_width, COL_COUNT));

        let x = alloc.x;
        let y = alloc.y;

        all_children.slice(0, visible_children_count).forEach((card, i) => {
            card.set_child_visible(true);
            let child_alloc = new Gdk.Rectangle({
                x: x,
                y: y,
                width: child_width,
                height: child_height,
            });
            card.size_allocate(child_alloc);

            if ((i + 1) % COL_COUNT === 0) {
                x = alloc.x;
                y += delta_y;
            } else {
                let sp = Arrangement.get_spare_pixels_for_card_index(spare_pixels, COL_COUNT, i);
                x += delta_x + sp;
            }
        });

        // Additional cards should not be visible!
        all_children.slice(visible_children_count, all_children.length).forEach((card) => {
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

    _get_size_with_spacing: function (size, count) {
        return size * count + this._spacing * (count - 1);
    },
});
