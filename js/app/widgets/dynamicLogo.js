// Copyright 2016 Endless Mobile, Inc.

/* exported DynamicLogo */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Rsvg = imports.gi.Rsvg;

const Knowledge = imports.app.knowledge;

const HEIGHT_WIDTH_RATIO = 1.5;
const DEFAULT_SPACING_RATIO = 1.15;

const Width = {
    MIN: 50,
    MAX: 400,
};

const Height = {
    MIN: 50,
    MAX: 400,
};

/**
 * Class: DynamicLogo
 *
 * This widget implements our dynamic logo system. A logo can be composed
 * of an image, text or both. This widget is considered dynamic because it
 * can be resized dynamically depending on its allocation size and it can
 * switch between different layouts depending on the geometry of its
 * allocation.
 */
var DynamicLogo = new Knowledge.Class({
    Name: 'DynamicLogo',
    Extends: Gtk.Widget,

    Properties: {
         /**
         * Property: image-uri
         *
         * A URI to the image displayed in the logo.
         */
        'image-uri': GObject.ParamSpec.string('image-uri', 'image-uri', 'image-uri',
            GObject.ParamFlags.READWRITE, ''),
         /**
         * Property: text
         *
         * The text displayed in the logo.
         */
        'text': GObject.ParamSpec.string('text', 'text', 'text',
            GObject.ParamFlags.READWRITE, ''),
         /**
         * Property: mode
         *
         * The mode of the logo, it can be text, image or full.
         */
        'mode': GObject.ParamSpec.string('mode', 'mode', 'mode',
            GObject.ParamFlags.READWRITE, ''),
         /**
         * Property: Layout
         *
         * The layout of the logo in full mode, it can be auto, horizontal or vertical.
         */
        'layout': GObject.ParamSpec.string('layout', 'layout', 'layout',
            GObject.ParamFlags.READWRITE, 'auto'),
    },

    StyleProperties: {
        /**
         * Property: max-width
         *
         * -EknDynamicLogo-max-width:
         *  * maximum width in pixels.
         */
        'max-width': GObject.ParamSpec.int('max-width', 'max-width', 'max-width',
            GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, 0),
        /**
         * Property: max-height
         *
         * -EknDynamicLogo-max-height:
         *  * maximum height in pixels.
         */
        'max-height': GObject.ParamSpec.int('max-height', 'max-height', 'max-height',
            GObject.ParamFlags.READABLE, 0, GLib.MAXINT32, 0),
        /**
         * Property: sizing
         *
         * -EknDynamicLogo-sizing:
         *  * 'auto'     - size determined by allocated size. Default.
         *  * 'size-min' - size determined by min-width and min-height css properties.
         */
        'sizing': GObject.ParamSpec.string('sizing', 'sizing', 'sizing',
            GObject.ParamFlags.READWRITE, 'auto'),
        /**
         * Property: text-transform
         *
         * -EknDynamicLogo-text-transform:
         *  * 'none'      - no transformation is performed. Default.
         *  * 'uppercase' - the text is transformed to uppercase.
         *  * 'lowercase' - the text is transformed to lowercase.
         */
        'text-transform': GObject.ParamSpec.string('text-transform', 'text-transform', 'text-transform',
            GObject.ParamFlags.READWRITE, 'none'),
    },

    _init: function (props={}) {
        this._image_uri = '';
        this._mode = 'text';
        this._layout = 'auto';
        this._text = '';
        this._sizing = 'auto';
        this._text_transform = 'none';
        this._pango_layout = null;
        this._image = null;
        this._max_width = Width.MAX;
        this._max_height = Height.MAX;
        this.parent(props);
        this.set_has_window(false);

        this.connect('style-set', () => this._update_custom_style());
        this.connect('style-updated', () => this._update_custom_style());
    },

    set image_uri (value) {
        if (this._image_uri === value)
            return;
        this._image_uri = value;
        this._load_image();
        this.queue_draw();
    },

    get image_uri () {
        return this._image_uri;
    },

    set mode(value) {
        if (this._mode === value)
            return;
        this._mode = value;
        this.queue_draw();
    },

    get mode() {
        return this._mode;
    },

    set layout(value) {
        if (this._layout === value)
            return;
        this._layout = value;
        this.queue_draw();
    },

    get layout() {
        return this._layout;
    },

    set text(value) {
        if (this._text === value)
            return;
        this._text = value;
        this._update_text();
        this.queue_draw();
    },

    get text() {
        return this._text;
    },

    _update_custom_style: function () {
        let context = this.get_style_context();

        let width = EosKnowledgePrivate.style_context_get_custom_int(context, 'max-width');
        this._update_max_width(width);

        let height = EosKnowledgePrivate.style_context_get_custom_int(context, 'max-height');
        this._update_max_height(height);

        this._sizing = EosKnowledgePrivate.style_context_get_custom_string(context, 'sizing');
        if (['size-min', 'auto'].indexOf(this._sizing) == -1) {
            let error = new Error('Unrecognized style property value for EknDynamicLogo-sizing ' + this._sizing);
            logError(error);
        }

        this._text_transform = EosKnowledgePrivate.style_context_get_custom_string(context, 'text-transform');
        if (['none', 'uppercase', 'lowercase'].indexOf(this._text_transform) == -1) {
            let error = new Error('Unrecognized style property value for EknDynamicLogo-text-transform ' + this._text_transform);
            logError(error);
        }
        this._update_text();
     },

    _load_image: function () {
        try {
            let file = Gio.File.new_for_uri(this._image_uri);
            let stream = file.read(null);
            this._image = Rsvg.Handle.new_from_stream_sync(stream, file, 0, null);
        } catch (e) {
            logError(e, 'Could not read image data');
        }
    },

    _update_max_width: function (width) {
        if (width <= 0 || width === this._max_width)
            return;

        this._max_width = width;
        this.queue_resize();
    },

    _update_max_height: function (height) {
        if (height <= 0 || height === this._max_height)
            return;

        this._max_height = height;
        this.queue_resize();
    },

    _update_text: function () {
        let transformed;
        switch (this._text_transform) {
            case 'uppercase':
                transformed = this._text.toLocaleUpperCase();
                break;
            case 'lowercase':
                transformed = this._text.toLocaleLowerCase();
                break;
            default:
                transformed = this._text;
        }
        if (!this._pango_layout)
            this._pango_layout = this.create_pango_layout(null);
        this._pango_layout.set_text(transformed, -1);
    },

    _get_fresh_state_context: function () {
        let context = this.get_style_context();
        let flags = this.get_state_flags();
        context.save();
        context.set_state(flags);
        return context;
    },

    _get_margin: function () {
        let context = this._get_fresh_state_context();
        let margin = context.get_margin(context.get_state());
        context.restore();
        return margin;
    },

    _get_padding: function () {
        let context = this._get_fresh_state_context();
        let padding = context.get_padding(context.get_state());
        context.restore();
        return padding;
    },

    vfunc_get_preferred_width: function () {
        let min_width = EosKnowledgePrivate.style_context_get_int(this.get_style_context(),
                                                                  'min-width',
                                                                  this.get_state_flags());
        min_width = min_width ? min_width : this.width_request;
        min_width = min_width > 0 ? min_width : Width.MIN;
        this._max_width = this._max_width < min_width ? min_width : this._max_width;
        let nat_width = this._sizing === 'size-min' ? min_width : this._max_width;

        let margin = this._get_margin();
        let padding = this._get_padding();
        let extra = margin.left + margin.right + padding.left + padding.right;

        return [min_width + extra, nat_width + extra];
    },

    vfunc_get_preferred_height: function () {
        let min_height = EosKnowledgePrivate.style_context_get_int(this.get_style_context(),
                                                                   'min-height',
                                                                   this.get_state_flags());
        min_height = min_height ? min_height : this.height_request;
        min_height = min_height > 0 ? min_height : Height.MIN;
        this._max_height = this._max_height < min_height ? min_height : this._max_height;
        let nat_height = this._sizing === 'size-min' ? min_height : this._max_height;

        let margin = this._get_margin();
        let padding = this._get_padding();
        let extra = margin.top + margin.bottom + padding.top + padding.bottom;

        return [min_height + extra, nat_height + extra];
    },

    vfunc_draw: function (cr) {
        let style = this.get_style_context();

        let alloc = this.get_allocation();
        let margin = this._get_margin();
        let padding = this._get_padding();
        let translate_x = margin.left + padding.left;
        let translate_y = margin.top + padding.top;

        alloc.width -= (margin.left + margin.right + padding.left + padding.right);
        alloc.height -= (margin.top + margin.bottom + padding.top + padding.bottom);

        let max_width = alloc.width;
        let max_height = alloc.height;

        if (alloc.width > this._max_width) {
            max_width = this._max_width;
            translate_x += (alloc.width - this._max_width) / 2;
        }
        if (alloc.height > this._max_height) {
            max_height = this._max_height;
            translate_y += (alloc.height - this._max_height) / 2;
        }

        // Draw background with padding
        let padding_x = translate_x - padding.left;
        let padding_y = translate_y - padding.top;
        let padding_width = max_width + padding.left + padding.right;
        let padding_height = max_height + padding.top + padding.bottom;
        Gtk.render_background(style, cr, padding_x, padding_y, padding_width, padding_height);
        Gtk.render_frame(style, cr, padding_x, padding_y, padding_width, padding_height);
        Gtk.render_focus(style, cr, padding_x, padding_y, padding_width, padding_height);

        cr.translate(translate_x, translate_y);

        switch(this._mode) {
            case 'image':
                this._draw_image_mode(cr, max_width, max_height);
                break;
            case 'text':
                this._draw_text_mode(cr, max_width, max_height);
                break;
            case 'full':
                this._draw_full_mode(cr, max_width, max_height);
       }
       cr.$dispose();
    },

    _translate_and_scale: function (cr, width, height, max_width, max_height) {
        let scale = Math.min(max_width / width, max_height / height);
        let translate_x = (max_width / 2) - ((width * scale) / 2);
        let translate_y = (max_height / 2) - ((height * scale) / 2);

        cr.translate(translate_x, translate_y);
        cr.scale(scale, scale);
    },

    _draw_image_mode: function (cr, max_width, max_height) {
        let dimensions = this._image.get_dimensions();
        this._translate_and_scale(cr, dimensions.width, dimensions.height, max_width, max_height);
        this._image.render_cairo(cr);
    },

    _draw_text_mode: function (cr, max_width, max_height) {
        let [width, height] = this._pango_layout.get_pixel_size();
        this._translate_and_scale(cr, width, height, max_width, max_height);
        Gtk.render_layout(this.get_style_context(), cr, 0, 0, this._pango_layout);
    },

    _draw_full_mode: function (cr, max_width, max_height) {
        let is_horizontal;
        switch(this._layout) {
            case 'horizontal':
                is_horizontal = true;
                break;
            case 'vertical':
                is_horizontal = false;
                break;
            default:
                is_horizontal = max_width > max_height * HEIGHT_WIDTH_RATIO;
        }

        let image_width, image_height, text_width, text_height;
        if (is_horizontal) {
            image_width = max_width * (1 / 4);
            image_height = max_height;
            text_width = max_width * (3 / 4);
            text_height = max_height;
        } else {
            image_width = max_width;
            image_height = max_height * (3 / 5);
            text_width = max_width;
            text_height = max_height * (2 / 5);
        }

        let image_scale, text_scale, text_size, image_size, ink_size;
        if (is_horizontal) {
            [ink_size, text_size] = this._pango_layout.get_pixel_extents();
            text_scale = Math.min(text_width / text_size.width, text_height / text_size.height);
            image_size = this._image.get_dimensions();
            // XXX this is a cheaper way to keep image and text equal in height
            image_scale = ((ink_size.height * text_scale) / image_size.height);

            // if doesn't fit in then scale text height to image height
            if (image_width < image_size.width * image_scale) {
                image_scale = Math.min(image_width / image_size.width, image_height / image_size.height);
                text_scale = ((image_size.height * image_scale) / ink_size.height);
            }
        } else {
            image_size = this._image.get_dimensions();
            image_scale = Math.min(image_width / image_size.width, image_height / image_size.height);
            [ ,text_size] = this._pango_layout.get_pixel_extents();
            text_scale = Math.min(text_width / text_size.width, text_height / text_size.height);
        }

        let image_translate_x, image_translate_y, text_translate_x, text_translate_y;
        if (is_horizontal) {
            let complete_width = (image_size.width * image_scale * DEFAULT_SPACING_RATIO) + (text_size.width * text_scale);
            image_translate_x = (max_width / 2) - (complete_width / 2);
            image_translate_y = (max_height / 2) - ((image_size.height * image_scale) / 2);
            text_translate_x =  image_translate_x + (image_size.width * image_scale * DEFAULT_SPACING_RATIO);
            text_translate_y = (max_height / 2) - ((text_size.height * text_scale) / 2);
        } else {
            let complete_height = (image_size.height * image_scale) + (text_size.height * text_scale);
            image_translate_x = (max_width / 2) - ((image_size.width * image_scale) / 2);
            image_translate_y = (max_height / 2) - (complete_height / 2);
            text_translate_x = (max_width / 2) - ((text_size.width * text_scale) / 2);
            text_translate_y = image_translate_y + (image_size.height * image_scale);
        }

        cr.save();
        cr.translate(image_translate_x, image_translate_y);
        cr.scale(image_scale, image_scale);
        this._image.render_cairo(cr);
        cr.restore();

        cr.save();
        cr.translate(text_translate_x, text_translate_y);
        cr.scale(text_scale, text_scale);
        Gtk.render_layout(this.get_style_context(), cr, 0, 0, this._pango_layout);
        cr.restore();
    },
});
