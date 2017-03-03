// Copyright 2016 Endless Mobile, Inc.

/* exported DynamicBackground */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const DominantColor = imports.app.dominantColor;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const DEFAULT_COLOR = '#BBBCB6';
const DEFAULT_HEIGHT = 100;

const THRESHOLD_SMALL = 960;
const THRESHOLD_MEDIUM = 1360;
const THRESHOLD_LARGE = 1600;

const DEFAULT_IMAGE = 'resource:///com/endlessm/knowledge/data/images/background.png';

const _cssTemplate = '.LayoutDynamicBackground {\
    background-image: linear-gradient(@{bottom}), linear-gradient(alpha(black, 0.3)), linear-gradient(alpha(@{overlay}, 0.4)), url("@{image}");\
    background-repeat: no-repeat, no-repeat, no-repeat, no-repeat;\
    background-size: auto, auto, auto, 100% auto;\
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
        /**
         * Slot: content
         * A template module
         */
        'content': {},
    },
    References: {
        'selection': {},  // type: Selection
    },

    _init: function (props={}) {
        this.parent(props);
        this.add(this.create_submodule('content'));

        this._css_class = '';
        this._model = null;
        this._overlay_color = DEFAULT_COLOR;
        this._image_uri = DEFAULT_IMAGE;
        this._background_height = DEFAULT_HEIGHT;
        this._background_color = DEFAULT_COLOR;
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
        let context = this.get_style_context();

        let height = EosKnowledgePrivate.style_context_get_custom_int(
            context, 'background-height');
        let rgba = context.get_background_color(Gtk.StateFlags.NORMAL);
        let color = Utils._rgba_to_markup_color(rgba);

        if (this._background_height === height && this._background_color === color)
            return;

        this._background_height = height;
        this._background_color = color;
        this._update_background();
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
            let item = HistoryStore.get_default().get_current_item();
            if (!item || !item.model)
                return;
            this._model = item.model;
        } else if (this._model === models[0]) {
            return;
        } else {
            this._model = models[0];
        }

        try {
            this._overlay_color = DominantColor.get_dominant_color(this._model);
            this._image_uri = this._model.thumbnail_uri;
        } catch (error) {
            logError(error);
            this._overlay_color = DEFAULT_COLOR;
            this._image_uri = DEFAULT_IMAGE;
        }
        this._update_background();
    },

    _update_background: function () {
        let css_data = _cssTemplate.replace('@{overlay}', this._overlay_color);
        css_data = css_data.replace('@{bottom}', this._background_color);
        css_data = css_data.replace('@{image}', this._image_uri);
        css_data = css_data.replace('@{height}', this._background_height);
        this._css_provider.load_from_data(css_data);
    },
});
