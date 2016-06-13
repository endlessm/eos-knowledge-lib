// Copyright 2016 Endless Mobile, Inc.

/* exported ParallaxBackground */

const GdkPixbuf = imports.gi.GdkPixbuf;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const Simple = imports.app.modules.pager.simple;
const Utils = imports.app.utils;

/**
 * Defines how much the background slides when switching pages, and
 * therefore also how zoomed in the background image is from its
 * original size.
 */
const PARALLAX_BACKGROUND_SCALE = 1.1;

/**
 * Class: ParallaxBackground
 * Pager that provides a parallax effect on its page backgrounds
 *
 * FIXME: if GTK gains support for the 'vmax' CSS unit, then we can move this
 * effect to pure CSS and get rid of this module and its extra CSS provider.
 * https://developer.mozilla.org/en-US/docs/Web/CSS/length
 *
 * CSS classes:
 *   PagerParallaxBackground--center - when on the appropriate page
 *   PagerParallaxBackground--left - when on the appropriate page
 *   PagerParallaxBackground--parallax - when parallax animations are enabled
 *   PagerParallaxBackground--right - when on the appropriate page
 */
const ParallaxBackground = new Module.Class({
    Name: 'Pager.ParallaxBackground',
    Extends: Simple.Simple,

    Properties: {
        /**
         * Property: background-image-uri
         * The background image of this window
         *
         * Used for size calculations.
         */
        'background-image-uri': GObject.ParamSpec.string('background-image-uri',
            'Background image URI', 'The background image of this window',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
    },

    _init: function (props={}) {
        this.parent(props);

        this._style_classes = {};
        ['parallax', 'left', 'center', 'right'].forEach(modifier => {
            this._style_classes[modifier] =
                Utils.get_modifier_style_class(ParallaxBackground, modifier);
        });

        let context = this.get_style_context();
        this._bg_size_provider = new Gtk.CssProvider();
        context.add_provider(this._bg_size_provider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        if (!Utils.low_performance_mode())
            context.add_class(this._style_classes['parallax']);

        if (this.background_image_uri) {
            try {
                let stream = Gio.File.new_for_uri(this.background_image_uri).read(null);
                let bg_pixbuf = GdkPixbuf.Pixbuf.new_from_stream(stream, null);
                this._background_image_width = bg_pixbuf.width;
                this._background_image_height = bg_pixbuf.height;
            } catch (e) {
                logError(e, 'Background image URI is not a valid format.');
            }
        }

        this.connect('notify::visible-child',
            this._on_visible_child_changed.bind(this));
        this._on_visible_child_changed();
    },

    _on_visible_child_changed: function () {
        let context = this.get_style_context();
        context.remove_class(this._style_classes['left']);
        context.remove_class(this._style_classes['center']);
        context.remove_class(this._style_classes['right']);

        let new_page = this.visible_child;
        if (this._is_page_on_left(new_page)) {
            context.add_class(this._style_classes['left']);
        } else if (this._is_page_on_center(new_page)) {
            context.add_class(this._style_classes['center']);
        } else {
            context.add_class(this._style_classes['right']);
        }
    },

    vfunc_size_allocate: function (alloc) {
        this.parent(alloc);

        if (Utils.low_performance_mode())
            return;

        if (this.background_image_uri &&
            (!this._last_allocation ||
            this._last_allocation.width !== alloc.width ||
            this._last_allocation.height !== alloc.height)) {
            let bg_mult_ratio = Math.max(alloc.width / this._background_image_width,
                alloc.height / this._background_image_height) *
                PARALLAX_BACKGROUND_SCALE;
            let bg_width = Math.ceil(this._background_image_width * bg_mult_ratio);
            let bg_height = Math.ceil(this._background_image_height * bg_mult_ratio);
            let frame_css = '* { background-size: ' + bg_width + 'px ' +
                bg_height + 'px; }';
            this._bg_size_provider.load_from_data(frame_css);
        }
        this._last_allocation = alloc;
    },
});
