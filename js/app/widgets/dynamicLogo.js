// Copyright 2016 Endless Mobile, Inc.

/* exported DynamicLogo */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Rsvg = imports.gi.Rsvg;
const PangoCairo = imports.gi.PangoCairo;

const Knowledge = imports.app.knowledge;
const ThemeableImage = imports.app.widgets.themeableImage;
const FormattableLabel =imports.app.widgets.formattableLabel;
const Utils = imports.app.utils;
const WidgetSurfaceCache = imports.app.widgetSurfaceCache;

const HEIGHT_WIDTH_RATIO = 2.0;

const Width = {
    MIN: 50,
    MAX: 300,
};

const Height = {
    MIN: 50,
    MAX: 300,
};

/**
 * Class: DynamicLogo
 *
 * This widget implemenets our logo system. A logo can be composed of
 * an image, text or both.
 *
 * -EknDynamicLogo-mode:
 *  * 'full' - both symbol and wordmark are visible. Default.
 *  * 'image' - only the image is visible.
 *  * 'text' - only the text is visible.
 */
const DynamicLogo = new Knowledge.Class({
    Name: 'DynamicLogo',
    Extends: Gtk.Widget,

    Properties: {
        'image-uri': GObject.ParamSpec.string('image-uri', 'image-uri', 'image-uri',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    StyleProperties: {
        'mode': GObject.ParamSpec.string('mode', 'mode', 'mode',
            GObject.ParamFlags.READWRITE, 'full'),
        'sizing': GObject.ParamSpec.string('sizing', 'sizing', 'sizing',
            GObject.ParamFlags.READWRITE, 'auto'),
        'text-transform': GObject.ParamSpec.string('text-transform', 'text-transform', 'text-transform',
            GObject.ParamFlags.READWRITE, 'none'),
    },

    _init: function (props={}) {
        this.parent(props);
        this.set_has_window(false);

        let file = Gio.File.new_for_uri(this.image_uri);
        let stream = file.read(null);
        this._image = Rsvg.Handle.new_from_stream_sync(stream, file, 0, null);
        this._cache = new WidgetSurfaceCache.WidgetSurfaceCache(this, this._draw_mode.bind(this));

        this._text = 'placeholder';
        let app_info = Utils.get_desktop_app_info();
        if (app_info && app_info.get_name()) {
            this._text = app_info.get_name();
        }

        this.connect('style-set', () => this._update_custom_style());
        this.connect('style-updated', () => this._update_custom_style());

        this.set_size_request(Width.MIN, Height.MIN);
    },

    _update_text: function () {
        switch (this._text_transform) {
            case 'uppercase':
                this._text = this._text.toLocaleUpperCase();
                break;
            case 'lowercase':
                this._text = this._text.toLocaleLowerCase();
                break;
        }
    },

    _update_custom_style: function () {
        this._mode = EosKnowledgePrivate.style_context_get_custom_string(this.get_style_context(), 'mode');
        if (['full', 'image', 'text'].indexOf(this._mode) == -1) {
            let error = new Error('Unrecognized style property value for EknDynamicLogo-mode ' + this._mode);
            logError(error);
        }

        this._sizing = EosKnowledgePrivate.style_context_get_custom_string(this.get_style_context(), 'sizing');
        if (['size-min', 'auto'].indexOf(this._sizing) == -1) {
            let error = new Error('Unrecognized style property value for EknDynamicLogo-sizing ' + this._sizing);
            logError(error);
        }

        this._text_transform = EosKnowledgePrivate.style_context_get_custom_string(this.get_style_context(), 'text-transform');
        if (['none', 'uppercase', 'lowercase'].indexOf(this._text_transform) == -1) {
            let error = new Error('Unrecognized style property value for EknDynamicLogo-text-transform ' + this._text_transform);
            logError(error);
        }

        this._update_text();
     },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.CONSTANT_SIZE;
    },

    vfunc_get_preferred_width: function () {
        let min_width = EosKnowledgePrivate.style_context_get_int(this.get_style_context(), 'min-width', this.get_state_flags());
        min_width = min_width ? min_width : Width.MIN;
        let nat_width = this._sizing === 'size-min' ? min_width : Width.MAX;

        return [min_width, nat_width];
    },

    vfunc_get_preferred_height: function () {
        let min_height = EosKnowledgePrivate.style_context_get_int(this.get_style_context(), 'min-height', this.get_state_flags());
        min_height = min_height ? min_height : Height.MIN;
        let nat_height = this._sizing === 'size-min' ? min_height : Height.MAX;

        return [min_height, nat_height];
    },

    vfunc_draw: function (cr) {
        let width =  this.get_allocated_width();
        let height = this.get_allocated_height();

        if (this._previous_width !== width || this._previous_height !== height)
            this._cache.invalidate();

        cr.setSourceSurface(this._cache.get_surface(), 0, 0);
        cr.paint();
        cr.$dispose();
    },

    _draw_mode: function (cr) {
        if (this._mode === 'image') {
            this._draw_image_mode(cr);
            return;
        }

        if (this._mode === 'text') {
            this._draw_text_mode(cr);
            return;
        }

        let width =  this.get_allocated_width();
        let height = this.get_allocated_height();
        if (width > height * HEIGHT_WIDTH_RATIO) {
            this._draw_horizontal_mode(cr);
            return;
        }
        this._draw_vertical_mode(cr);
    },

    _draw_text_mode: function (cr) {
        let context = this._get_fresh_state_context();
        let total_width =  this.get_allocated_width();
        let total_height = this.get_allocated_height();

        let text_width = total_width;
        let text_height = total_height;

        let font_desc = context.get_font(context.get_state());
        let pango_layout = PangoCairo.create_layout(cr);
        pango_layout.set_font_description(font_desc);
        pango_layout.set_text(this._text, -1);

        let [text_pixel_width, text_pixel_height] = pango_layout.get_pixel_size();
        let text_scale_x = text_width / text_pixel_width;
        let text_scale_y = text_height / text_pixel_height;
        let text_scale = Math.min(text_scale_x, text_scale_y);

        let text_translate_x = (total_width / 2) - ((text_pixel_width * text_scale) / 2);
        let text_translate_y = (total_height / 2) - ((text_pixel_height * text_scale) / 2);

        Gtk.render_background(context, cr, 0, 0, total_width, total_height);

        cr.save();
        cr.translate(text_translate_x, text_translate_y);
        cr.scale(text_scale, text_scale);
        Gtk.render_layout(context, cr, 0, 0, pango_layout);
        cr.restore();
    },

    _draw_image_mode: function (cr) {
        let context = this._get_fresh_state_context();
        let total_width =  this.get_allocated_width();
        let total_height = this.get_allocated_height();

        let image_width = total_width;
        let image_height = total_height;

        let image_dimensions = this._image.get_dimensions();
        let image_scale_x = image_width / image_dimensions.width;
        let image_scale_y = image_height / image_dimensions.height;
        let image_scale = Math.min(image_scale_x, image_scale_y);

        let image_translate_x = (total_width / 2) - ((image_dimensions.width * image_scale) / 2);
        let image_translate_y = (total_height / 2) - ((image_dimensions.height * image_scale) / 2);

        Gtk.render_background(context, cr, 0, 0, total_width, total_height);

        cr.save();
        cr.translate(image_translate_x, image_translate_y);
        cr.scale(image_scale, image_scale);
        this._image.render_cairo(cr);
        cr.restore();
    },

    _draw_horizontal_mode: function (cr) {
        let context = this._get_fresh_state_context();
        let total_width =  this.get_allocated_width();
        let total_height = this.get_allocated_height();

        let image_width = total_width * (1 / 4);
        let image_height = total_height;

        let text_width = total_width * (3 / 4);
        let text_height = total_height;

        let image_dimensions = this._image.get_dimensions();
        let image_scale_x = image_width / image_dimensions.width;
        let image_scale_y = image_height / image_dimensions.height;
        let image_scale = Math.min(image_scale_x, image_scale_y);

        let font_desc = context.get_font(context.get_state());
        let pango_layout = PangoCairo.create_layout(cr);
        pango_layout.set_font_description(font_desc);
        pango_layout.set_text(this._text, -1);

        let [text_pixel_width, text_pixel_height] = pango_layout.get_pixel_size();
        let text_scale_x = text_width / text_pixel_width;
        let text_scale_y = text_height / text_pixel_height;
        let text_scale = Math.min(text_scale_x, text_scale_y);

        let complete_width = (image_dimensions.width * image_scale) + (text_pixel_width * text_scale);
        let compelte_height = (image_dimensions.height * image_scale) + (text_pixel_height * text_scale);

        let image_translate_x = (total_width / 2) - (complete_width / 2);
        let image_translate_y = (total_height / 2) - ((image_dimensions.height * image_scale) / 2);

        let text_translate_x = image_translate_x + (image_dimensions.width * image_scale);
        let text_translate_y = (total_height / 2) - ((text_pixel_height * text_scale) / 2);

        Gtk.render_background(context, cr, 0, 0, total_width, total_height);

        cr.save();
        cr.translate(image_translate_x, image_translate_y);
        cr.scale(image_scale, image_scale);
        this._image.render_cairo(cr);
        cr.restore();

        cr.save();
        cr.translate(text_translate_x, text_translate_y);
        cr.scale(text_scale, text_scale);
        Gtk.render_layout(context, cr, 0, 0, pango_layout);
        cr.restore();
    },

    _draw_vertical_mode: function (cr) {
        let context = this._get_fresh_state_context();
        let total_width =  this.get_allocated_width();
        let total_height = this.get_allocated_height();

        let image_width = total_width;
        let image_height = total_height * (3 / 4);

        let text_width = total_width;
        let text_height = total_height * (1 / 4);

        let image_dimensions = this._image.get_dimensions();
        let image_scale_x = image_width / image_dimensions.width;
        let image_scale_y = image_height / image_dimensions.height;
        let image_scale = Math.min(image_scale_x, image_scale_y);

        let image_translate_x = (total_width / 2) - ((image_dimensions.width * image_scale) / 2)
        let image_translate_y = 0;

        let font_desc = context.get_font(context.get_state());
        let pango_layout = PangoCairo.create_layout(cr);
        pango_layout.set_font_description(font_desc);
        pango_layout.set_text(this._text, -1);

        let [text_pixel_width, text_pixel_height] = pango_layout.get_pixel_size();
        let text_scale_x = text_width / text_pixel_width;
        let text_scale_y = text_height / text_pixel_height;
        let text_scale = Math.min(text_scale_x, text_scale_y);

        let text_translate_x = (total_width / 2) - ((text_pixel_width * text_scale) / 2)
        let text_translate_y = image_height;

        Gtk.render_background(context, cr, 0, 0, total_width, total_height);

        cr.save();
        cr.translate(image_translate_x, image_translate_y);
        cr.scale(image_scale, image_scale);
        this._image.render_cairo(cr);
        cr.restore();

        cr.save();
        cr.translate(text_translate_x, text_translate_y);
        cr.scale(text_scale, text_scale);
        Gtk.render_layout(context, cr, 0, 0, pango_layout);
        cr.restore();
    },

    _get_fresh_state_context: function () {
        let context = this.get_style_context();
        let flags = this.get_state_flags();

        context.save();
        context.set_state(flags);

        return context;
    },
});
