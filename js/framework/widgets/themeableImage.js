/* exported ThemeableImage */

const Endless = imports.gi.Endless;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Knowledge = imports.framework.knowledge;
const Utils = imports.framework.utils;

function clamp(x, low, high) {
    return (x > high) ? high : ((x < low) ? low : x);
}

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
var ThemeableImage = new Knowledge.Class({
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
        let probe = Endless.ProfileProbe.start('/ekn/themeableImage/_init');

        this.parent(props);
        this.set_has_window(false);
        this._sizing = 'size-full';

        let size = Utils.get_image_size_from_uri(this.image_uri);
        if (size) {
            this._pixbuf_width = size.width;
            this._pixbuf_height = size.height;

            let provider = new Gtk.CssProvider();
            provider.load_from_data(
                `.ThemeableImage {
                    -gtk-icon-source: none;
                    background: url('${this.image_uri}') center no-repeat;
                    background-size: contain;
                }`);
            this.get_style_context().add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION - 10);
        }

        this.connect('style-updated', () => this._update_custom_style());

        probe.stop();
    },

    _update_custom_style: function () {
        let sizing = EosKnowledgePrivate.style_context_get_custom_string(this.get_style_context(), 'sizing');
        if (['size-full', 'size-down', 'size-min'].indexOf(sizing) == -1) {
            let error = new Error('Unrecognized option style property value for -EknThemeableImage-sizing ' + sizing);
            logError(error);
            return;
        }

        if (this._sizing !== sizing) {
            this._sizing = sizing;
            this.queue_resize();
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
        if (this._pixbuf_width) {
            nat_width = Math.max(nat_width, this._pixbuf_width);
            if (this._sizing === 'size-min') {
                nat_width = min_width;
            } else if (this._sizing === 'size-full') {
                min_width = nat_width;
            }
        }

        this._min_width = min_width;
        this._nat_width = nat_width;

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
        if (this._pixbuf_height) {
            nat_height = Math.max(nat_height, this._pixbuf_height);
            if (this._sizing === 'size-min') {
                nat_height = min_height;
            } else if (this._sizing === 'size-full') {
                min_height = nat_height;
            }
        }

        this._min_height = min_height;
        this._nat_height = nat_height;

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

    vfunc_draw: function (cr) {
        let context = this.get_style_context();
        let alloc_width = this.get_allocated_width();
        let alloc_height = this.get_allocated_height();
        let padding = this._get_padding();
        let border = this._get_border();

        let width = alloc_width - padding.left - padding.right - border.left - border.right;
        let height = alloc_height - padding.top - padding.bottom - border.top - border.bottom;
        if (this._pixbuf_width) {
            let w = this._pixbuf_width;
            let h = this._pixbuf_height;

            if (width < w) {
                h *= width / w;
                w = width;
            }

            if (height < h) {
                w *= height / h;
                h = height;
            }

            w = clamp(w, this._min_width, this._nat_width);
            h = clamp(h, this._min_height, this._nat_height);

            let x = (alloc_width - w)/2.0 - border.left;
            let y = (alloc_height - h)/2.0 - border.top;

            w += border.left + border.right;
            h += border.top + border.bottom;

            Gtk.render_background(context, cr, x, y, w, h);

            x -= padding.left;
            y -= padding.top;
            w += padding.left + padding.right;
            h += padding.top + padding.bottom;

            Gtk.render_frame(context, cr, x, y, w, h);

            if (this.can_focus && this.has_focus)
                Gtk.render_focus(context, cr, x, y, w, h);
            } else {
            Gtk.render_activity(context, cr,
                padding.left + border.left,
                padding.top + border.top,
                width, height);
        }
        cr.$dispose();
    },
});
