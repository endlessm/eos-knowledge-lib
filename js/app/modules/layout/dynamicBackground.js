// Copyright 2016 Endless Mobile, Inc.

/* exported DynamicBackground */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const DominantColor = imports.app.dominantColor;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const DEFAULT_COLOR = '#BBBCB6';
const DEFAULT_HEIGHT = 100;

const THRESHOLD_SMALL = 960;
const THRESHOLD_MEDIUM = 1360;
const THRESHOLD_LARGE = 1600;

// FIXME: Replace for real blurred images
const _topImage = 'resource:///com/endlessm/knowledge/data/images/background.png';

const _cssTemplate = '.LayoutDynamicBackground {\
    background-image: linear-gradient(@{bottom}), linear-gradient(alpha(black, 0.3)), linear-gradient(alpha(@{overlay}, 0.4)), url("@{image}");\
    background-position: 0px @{height}px, 0px 0px, 0px 0px, 0px 0px;\
}';

/**
 * Class: DynamicBackground
 * Module for displaying a background
 *
 * The background is composed of three layers, a blurred image that goes
 * on the top, a tinted semi-transparent overlay that covers the image
 * and a beige overlay that covers the bottom.
 *
 * The tinted overlay color is extracted from thumbnail image of a
 * <ContentObjectModel>.
 *
 * Slots:
 *   content - a template module
 */
const DynamicBackground = new Module.Class({
    Name: 'Layout.DynamicBackground',
    Extends: Gtk.Frame,

    StyleProperties: {
        'background-height': GObject.ParamSpec.int('background-height',
            'Background height', 'Background height in pixels',
            GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, DEFAULT_HEIGHT),
    },

    Slots: {
        'content': {},
    },
    References: {
        'selection': {},  // type: Selection
    },

    _init: function (props={}) {
        this.parent(props);
        this.add(this.create_submodule('content'));

        this._css_class = '';
        this._bg_color = null;
        this._color = null;
        this._background_height = DEFAULT_HEIGHT;
        this._css_provider = new Gtk.CssProvider();

        let context = this.get_style_context();
        context.add_provider(this._css_provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        this.reference_module('selection', selection => {
            selection.connect('models-changed',
                this._on_selection_models_changed.bind(this));
        });

        this._idle_id = 0;
        this.connect_after('size-allocate', () => {
            if (this._idle_id) {
                return;
            }
            this._idle_id = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                this._update_css_class();
                this._idle_id = 0;
            });
        });

        this.connect('style-set', this._update_custom_style.bind(this));
        this.connect('style-updated', this._update_custom_style.bind(this));
    },

    _update_custom_style: function () {
        let height = EosKnowledgePrivate.style_context_get_custom_int(
            this.get_style_context(), 'background-height');

        if (this._background_height === height)
            return;

        this._background_height = height;
        this._set_background(this._color);
    },

    _update_css_class: function () {
        let css_class = 'large';
        let alloc = this.get_allocation();

        if (alloc.width <=  THRESHOLD_SMALL) {
            css_class = 'small';
        } else if (alloc.width <= THRESHOLD_MEDIUM) {
            css_class = 'medium';
        }

        if (css_class === this._css_class)
            return;

        let context = this.get_style_context();
        context.remove_class(this._css_class);
        context.add_class(css_class);
        this._css_class = css_class;
        this._update_custom_style();
    },

    _on_selection_models_changed: function (selection) {
        let models = selection.get_models();

        if (models.length === 0) {
            /* keep previous color if there is one */
            if (!this._color)
                this._set_background(DEFAULT_COLOR);
            return;
        }

        DominantColor.get_dominant_color(models[0], null, (helper, task) => {
            let color;
            try {
                color = helper.get_dominant_color_finish(task);
            } catch (error) {
                color = DEFAULT_COLOR;
            }
            this._set_background(color);
        });
    },

    _set_background: function (color) {
        // Take the background color from the css for the bottom part
        if (!this._bg_color) {
            let context = this.get_style_context();
            let bg_rgba = context.get_background_color(Gtk.StateFlags.NORMAL);
            this._bg_color = Utils._rgba_to_markup_color(bg_rgba);
        }

        if (!color)
            return;
        this._color = color;

        let css_data = _cssTemplate.replace('@{overlay}', this._color);
        css_data = css_data.replace('@{bottom}', this._bg_color);
        css_data = css_data.replace('@{image}', _topImage);
        css_data = css_data.replace('@{height}', this._background_height);
        this._css_provider.load_from_data(css_data);
    },
});
