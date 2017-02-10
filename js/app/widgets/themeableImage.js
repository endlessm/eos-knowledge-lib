/* exported ThemeableImage */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gdk = imports.gi.Gdk;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Knowledge = imports.app.knowledge;
const WidgetSurfaceCache = imports.app.widgetSurfaceCache;

/**
 * Class: ThemeableImage
 *
 * ThemeableImage is a bit of a weird science experiment, one that can maybe
 * go away as Gtk gets more expressive. It renders an image that very
 * customizable in css.
 *
 * This widget has two main rendering modes. It can render an image file if
 * image-uri is set, or a icon set directly in css with -gtk-icon-source.
 *
 * If an image (and not icon) is being rendered, the -EknThemeableImage-sizing
 * custom style property governs it sizing behavior.
 * If the value is 'size-full' the image will always appear at full size
 * If the value is 'size-down' the image will shrink from full to min size
 * If the value is 'size-min' the image will always appear at min size
 */
const ThemeableImage = new Knowledge.Class({
    Name: 'ThemeableImage',
    Extends: Gtk.Widget,
    Properties: {
        /**
         * Property: image-uri
         * A URI to the title image. Defaults to an empty string.
         */
        'image-uri': GObject.ParamSpec.string('image-uri', 'image-uri', 'image-uri',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    StyleProperties: {
        'sizing': GObject.ParamSpec.string('sizing', 'sizing', 'sizing',
            GObject.ParamFlags.READWRITE, 'size-full'),
    },

    _init: function (props={}) {
        this.parent(props);
        this.set_has_window(false);
        this._min_width = 0;
        this._min_height = 0;
        this._sizing = 'full-size';

        let provider = new Gtk.CssProvider();
        provider.load_from_data('* { -gtk-icon-source: none; }');
        this.get_style_context().add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION - 10);

        this._pixbuf = null;
        this._surface_cache = null;
        this._image_width = 0;
        this._image_height = 0;
        let file = Gio.File.new_for_uri(this.image_uri);
        if (file.query_exists(null)) {
            let stream = file.read(null);
            this._pixbuf = GdkPixbuf.Pixbuf.new_from_stream(stream, null);
            this._surface_cache = new WidgetSurfaceCache.WidgetSurfaceCache(this, this._draw_scaled_pixbuf.bind(this));
        }

        this.connect('style-set', () => this._update_custom_style());
        this.connect('style-updated', () => this._update_custom_style());
    },

    _update_custom_style: function () {
        this._sizing = EosKnowledgePrivate.style_context_get_custom_string(this.get_style_context(), 'sizing');
        if (['size-full', 'size-down', 'size-min'].indexOf(this._sizing) == -1) {
            let error = new Error('Unrecognized option style property value for -EknThemeableImage-sizing ' + this._sizing);
            logError(error);
        }
     },

    _get_margin: function () {
        let context = this._get_fresh_state_context();
        let margin = context.get_margin(context.get_state());
        context.restore();
        return margin;
    },

    _get_border: function () {
        let context = this._get_fresh_state_context();
        let border = context.get_border(context.get_state());
        context.restore();
        return border;
    },

    _get_padding: function () {
        let context = this._get_fresh_state_context();
        let padding = context.get_padding(context.get_state());
        context.restore();
        return padding;
    },

    _get_fresh_state_context: function () {
        let context = this.get_style_context();
        let flags = this.get_state_flags();

        context.save();
        context.set_state(flags);

        return context;
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.CONSTANT_SIZE;
    },

    vfunc_get_preferred_width: function () {
        let min_width = EosKnowledgePrivate.style_context_get_int(this.get_style_context(),
                                                                  'min-width',
                                                                  this.get_state_flags());
        min_width = Math.max(min_width, this.width_request);
        let nat_width = min_width;
        if (this._pixbuf) {
            nat_width = Math.max(nat_width, this._pixbuf.width);
            if (this._sizing === 'size-min') {
                nat_width = min_width;
            } else if (this._sizing === 'size-full') {
                min_width = nat_width;
            }
        }
        let extra = [this._get_margin(), this._get_border(), this._get_padding()].reduce((total, border) => {
            return total + border.left + border.right;
        }, 0);

        if (min_width + extra > 0)
            min_width += extra;
        if (nat_width + extra > 0)
            nat_width += extra;

        return [min_width, nat_width];
    },

    vfunc_get_preferred_height: function () {
        let min_height = EosKnowledgePrivate.style_context_get_int(this.get_style_context(),
                                                                   'min-height',
                                                                   this.get_state_flags());
        min_height = Math.max(min_height, this.height_request);
        let nat_height = min_height;
        if (this._pixbuf) {
            nat_height = Math.max(nat_height, this._pixbuf.height);
            if (this._sizing === 'size-min') {
                nat_height = min_height;
            } else if (this._sizing === 'size-full') {
                min_height = nat_height;
            }
        }
        let extra = [this._get_margin(), this._get_border(), this._get_padding()].reduce((total, border) => {
            return total + border.top + border.bottom;
        }, 0);

        if (min_height + extra > 0)
            min_height += extra;
        if (nat_height + extra > 0)
            nat_height += extra;

        return [min_height, nat_height];
    },

    vfunc_size_allocate: function (allocation) {
        let margin = this._get_margin();

        let horizontal_margin = margin.left + margin.right;
        if (allocation.width - horizontal_margin > 0) {
            allocation.x += margin.left;
            allocation.width -= margin.left + margin.right;
        }

        let vertical_margin = margin.top + margin.bottom;
        if (allocation.height - vertical_margin > 0) {
            allocation.y += margin.top;
            allocation.height -= vertical_margin;
        }

        this.set_allocation(allocation);
        // FIXME: Clip is not set correctly for this widget as there's no way
        // for out of tree widgets to access box shadow extents. We could carry
        // a patch to fix this in Gtk if the need arises
    },

    _draw_scaled_pixbuf: function (cr) {
        // Helps to read these transforms in reverse. We center the pixbuf at
        // the origin, scale it to fit, then translate its center to the
        // center of our allocation.
        cr.translate(this._image_width / 2, this._image_height / 2);
        let scale = Math.min(this._image_width / this._pixbuf.get_width(),
                             this._image_height / this._pixbuf.get_height());
        scale = Math.min(1, scale);
        cr.scale(scale, scale);
        cr.translate(-this._pixbuf.get_width() / 2, -this._pixbuf.get_height() / 2);

        Gdk.cairo_set_source_pixbuf(cr, this._pixbuf, 0, 0);
        cr.paint();
    },

    vfunc_draw: function (cr) {
        let width = this.get_allocated_width();
        let height = this.get_allocated_height();
        Gtk.render_background(this.get_style_context(), cr,
            0, 0, width, height);
        Gtk.render_frame(this.get_style_context(), cr,
            0, 0, width, height);
        Gtk.render_focus(this.get_style_context(), cr,
            0, 0, width, height);
        let padding = this._get_padding();
        let border = this._get_border();

        width = width - padding.left - padding.right - border.left - border.right;
        height = height - padding.top - padding.bottom - border.top - border.bottom;
        if (this._pixbuf) {
            let do_invalidate = this._image_width !== width || this._image_height !== height;
            this._image_width = width;
            this._image_height = height;
            if (do_invalidate)
                this._surface_cache.invalidate();
            cr.setSourceSurface(this._surface_cache.get_surface(),
                                padding.left + border.left, padding.top + border.top);
            cr.paint();
        } else {
            Gtk.render_activity(this.get_style_context(), cr,
                padding.left + border.left, padding.top + border.top,
                width, height);
        }
        cr.$dispose();
    },
});
