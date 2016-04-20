// Copyright 2014 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
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
const CardA = new Module.Class({
    Name: 'CardA',
    CssName: 'EknCardA',
    Extends: Gtk.Button,
    Implements: [Card.Card],

    Template: 'resource:///com/endlessm/knowledge/data/widgets/cardA.ui',
    InternalChildren: [ 'thumbnail-frame', 'title-label', 'synopsis-label',
        'pdf-icon', 'pdf-label' ],

    _init: function (props={}) {
        this.parent(props);

        this.set_title_label_with_highlight(this._title_label);

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

            this.set_label_with_highlight(this._synopsis_label, this.model.synopsis);
            this._synopsis_label.visible = this._synopsis_label.visible && !is_pdf;
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

        if (Endless.is_composite_tv_screen(null)) {
            this._synopsis_label.lines = 5;
        }
    },

    // Card override
    update_highlight_string: function () {
        if (this._title_label)
            this.set_title_label_with_highlight(this._title_label);
        if (this._synopsis_label && this._synopsis_label.visible)
            this.set_label_with_highlight(this._synopsis_label, this.model.synopsis);
    },

    _draw_cache_surface: function (cr) {
        // We will cache the scaled up version of the card to use when
        // transitioning, it leads to the nicest looking transition.
        let allocation = this.get_allocation();
        cr.translate(HOVER_WIDTH / 2, HOVER_HEIGHT / 2);
        cr.scale(1 + GROW_FRACTION, 1 + GROW_FRACTION);
        cr.translate(- allocation.width / 2, - allocation.height / 2);
        Gtk.Button.prototype.vfunc_draw.call(this, cr);
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
        let clip = new Gdk.Rectangle({
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
        // FIXME: figure out better way to respect childs size request
        let [min,] = this.parent();
        if (min > WIDTH)
            logError(new Error('CardA min width '+ min + ' greater than ' + WIDTH));
        return [WIDTH, WIDTH];
    },

    vfunc_get_preferred_height: function () {
        // FIXME: figure out better way to respect childs size request
        let [min,] = this.parent();
        if (min > HEIGHT)
            logError(new Error('CardA min width '+ min + ' greater than ' + HEIGHT));
        return [HEIGHT, HEIGHT];
    },
});
