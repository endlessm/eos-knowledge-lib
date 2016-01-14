// Copyright 2014 Endless Mobile, Inc.

const Cairo = imports.gi.cairo;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const MarginButton = imports.app.widgets.marginButton;
const Module = imports.app.interfaces.module;
const SetObjectModel = imports.search.setObjectModel;
const ToggleTweener = imports.app.toggleTweener;
const Utils = imports.app.utils;
const WidgetSurfaceCache = imports.app.widgetSurfaceCache;

const WIDTH = 197; // 183px width + 2 * 7px margin
const HEIGHT = 223; // 209px height + 2 * 7px margin
const GROW_FRACTION = 0.05;
const HOVER_WIDTH = Math.ceil(WIDTH * (1 + GROW_FRACTION));
const HOVER_HEIGHT = Math.ceil(HEIGHT * (1 + GROW_FRACTION));

/**
 * Class: CardA
 *
 * A card implementation with sizing and styling specific to template A
 */
const CardA = new Lang.Class({
    Name: 'CardA',
    GTypeName: 'EknCardA',
    Extends: MarginButton.MarginButton,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
        'highlight-string': GObject.ParamSpec.override('highlight-string', Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/cardA.ui',
    InternalChildren: [ 'thumbnail-frame', 'title-label', 'synopsis-label',
        'pdf-icon', 'pdf-label' ],

    _init: function (props={}) {
        this.parent(props);

        this.set_title_label_from_model(this._title_label);

        if (this.model instanceof SetObjectModel.SetObjectModel) {
            this.set_thumbnail_frame_from_model(this._thumbnail_frame);
        }
        this._thumbnail_frame.height_request = 133;

        if (!this._thumbnail_frame.visible) {
            this._title_label.xalign = 0;
            this._title_label.vexpand = false;

            let is_pdf = (this.model.content_type === 'application/pdf');
            this._pdf_icon.visible = is_pdf;
            this._pdf_label.visible = is_pdf;

            this.set_label_or_hide(this._synopsis_label, this.model.synopsis);
            this._synopsis_label.visible = this._synopsis_label.visible && !is_pdf;
            this._label_adjust_handler = this._synopsis_label.connect_after('size-allocate',
                this._after_synopsis_label_size_allocate.bind(this));
        }

        Utils.set_hand_cursor_on_widget(this);

        // We will cache the appearance of our card to a surface, and use the
        // cache only when animating the card bigger or smaller.
        this._surface_cache = new WidgetSurfaceCache.WidgetSurfaceCache(this,
            this._draw_cache_surface.bind(this), {
            width: HOVER_WIDTH,
            height: HOVER_HEIGHT,
        });
        this._tweener = new ToggleTweener.ToggleTweener(this, {
            inactive_value: 1,
            active_value: 1 + GROW_FRACTION,
        });
        this.connect('state-flags-changed', () => {
            this._tweener.set_active((this.get_state_flags() & Gtk.StateFlags.PRELIGHT) !== 0);
        });
    },

    _draw_cache_surface: function (cr) {
        // We will cache the scaled up version of the card to use when
        // transitioning, it leads to the nicest looking transition.
        let allocation = this.get_allocation();
        cr.translate(HOVER_WIDTH / 2, HOVER_HEIGHT / 2);
        cr.scale(1 + GROW_FRACTION, 1 + GROW_FRACTION);
        cr.translate(- allocation.width / 2, - allocation.height / 2);
        MarginButton.MarginButton.prototype.vfunc_draw.call(this, cr);
    },

    _after_synopsis_label_size_allocate: function (label, alloc) {
        if (!this._synopsis_label.visible)
            return;

        let card_alloc = this.get_allocation();
        // The label gets some space allocated that falls outside the
        // card boundary, the 'overshoot'.
        let overshoot = (alloc.y + alloc.height) -
            (card_alloc.y + card_alloc.height);
        let synopsis_height = alloc.height - overshoot;
        // '0' is the usual character for determining line height.
        let layout = label.create_pango_layout('0');
        let [ink_rect, logical_rect] = layout.get_pixel_extents();
        let synopsis_line_height = logical_rect.height;
        let lines = Math.floor(synopsis_height / synopsis_line_height);
        // Don't queue a resize from within a size_allocate()
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            label.lines = lines;
            return GLib.SOURCE_REMOVE;
        });

        // We can get away with doing this once, since the card is fixed-size.
        GObject.signal_handler_disconnect(label, this._label_adjust_handler);
        this._label_adjust_handler = 0;
    },

    vfunc_draw: function (cr) {
        let allocation = this.get_allocation();
        let scale = this._tweener.get_value();
        if (this._tweener.is_tweening()) {
            cr.translate(allocation.width / 2, allocation.height / 2);
            cr.scale(scale / (1 + GROW_FRACTION), scale / (1 + GROW_FRACTION));
            cr.translate(- HOVER_WIDTH / 2, - HOVER_HEIGHT / 2);
            cr.setSourceSurface(this._surface_cache.get_surface(), 0, 0);
            cr.paint();
        } else {
            cr.translate(allocation.width / 2, allocation.height / 2);
            cr.scale(scale, scale);
            cr.translate(-allocation.width / 2, -allocation.height / 2);
            this.parent(cr);
            this._surface_cache.invalidate();
        }
        cr.$dispose();
        return false;
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);
        let clip = new Cairo.RectangleInt({
            x: alloc.x - WIDTH * GROW_FRACTION / 2,
            y: alloc.y - HEIGHT * GROW_FRACTION / 2,
            width: HOVER_WIDTH,
            height: HOVER_HEIGHT,
        });
        this.set_clip(clip);
    },

    // For entirely fixed-size cards
    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.CONSTANT_SIZE;
    },

    vfunc_get_preferred_width: function () {
        return [WIDTH, WIDTH];
    },

    vfunc_get_preferred_height: function () {
        return [HEIGHT, HEIGHT];
    },
});
