const Gdk = imports.gi.Gdk;
const GdkPixbuf = imports.gi.GdkPixbuf;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;

const Knowledge = imports.app.knowledge;

/**
 * Class: ImagePreviewer
 *
 * A private class used by the Previewer. Will display an image in a widget.
 * Unlike GtkImage this widget will size down its image to the available
 * space, which is where most of the complexity in this class comes from.
 */
var ImagePreviewer = new Knowledge.Class({
    Name: 'ImagePreviewer',
    Extends: Gtk.Widget,
    Properties: {
        /**
         * Property: aspect
         *
         * The aspect the previewer widget should display at
         */
        'aspect': GObject.ParamSpec.float('aspect', 'Aspect',
            'Aspect ratio of previewer content',
            GObject.ParamFlags.READABLE,
            0.0, 100.0, 1.0),

        /**
         * Property: min-fraction
         * The smallest fraction of the widget's natural size to display at.
         */
        'min-fraction': GObject.ParamSpec.float('min-fraction', 'Min Fraction',
            'Min fraction of size to display at',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0.0, 1.0, 0.0),

        /**
         * Property: max-fraction
         * The largest fraction of the widget's natural size to display at.
         */
        'max-fraction': GObject.ParamSpec.float('max-fraction', 'Max Fraction',
            'Max fraction of size to display at',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0.0, 1.0, 1.0),

        /**
         * Property: enforce-minimum-size
         *
         * Whether this previewer should enforce a minimum size on its images.
         */
        'enforce-minimum-size': GObject.ParamSpec.boolean('enforce-minimum-size',
            'Enforce Minimum Size', 'Whether the image should always be at least a minimum size',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),

        /**
         * Property: minimum-size
         *
         * The height/width of a "minimum image size" square. If the file being
         * previewed fits inside this box, the image will be scaled up until
         * its largest dimension is exactly equal to this minimum size.
         */
        'minimum-size': GObject.ParamSpec.int('minimum-size',
            'Minimum Size', 'The minimum dimension of the image',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXINT32, 0),
    },

    _init: function (props) {
        props = props || {};
        props["app-paintable"] = true;
        this.parent(props);
        this.set_has_window(false);

        this._stream = null;
        this._animation = null;
        this._animation_iter = null;
        this._animation_callback_source = 0;
        this._pixbuf = null;
        this._scaled_pixbuf = null;
        this._aspect = 1.0;
        this._natural_width = 0;
        this._natural_height = 0;

        let formats = GdkPixbuf.Pixbuf.get_formats();
        this._supported_types = formats.reduce(function(type_list, format) {
            return type_list.concat(format.get_mime_types());
        }, []);

        this.show_all();
    },

    /**
     * Method: supports_type
     *
     * True if the given mime type is supported by the image previewer.
     */
    supports_type: function (type) {
        return this._supported_types.indexOf(type) != -1;
    },

    set_content: function (stream) {
        if (stream === this._stream)
            return;
        this._stream = stream;
        if (this._stream === null)
            return;


        this._animation = GdkPixbuf.PixbufAnimation.new_from_stream(this._stream, null);
        if (this._animation !== null) {
            if (this._animation.is_static_image()) {
                this._pixbuf = this._animation.get_static_image();
            }
            this._natural_width = this._animation.get_width();
            this._natural_height = this._animation.get_height();
            this._aspect = this._natural_width / this._natural_height;

            // Scale the image if it's smaller than a
            // MINIMUM_IMAGE_DIMENSION x MINIMUM_IMAGE_DIMENSION box.
            if (this.enforce_minimum_size
                && this._natural_width < this.minimum_size
                && this._natural_height < this.minimum_size) {

                // Only scale up the largest dimension, so the resulting image
                // fits exactly inside our minimum box
                if (this._natural_height >= this._natural_width) {
                    this._natural_height = this.minimum_size;
                    this._natural_width = this._aspect * this._natural_height;
                } else {
                    this._natural_width = this.minimum_size;
                    this._natural_height = this._natural_width / this._aspect;
                }
            }
        }

        this.queue_draw();
    },

    clear_content: function () {
        this._stream = null;
        this._animation = null;
    },

    get aspect () {
        return this._aspect;
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.CONSTANT_SIZE;
    },

    _get_preferred_size: function (orientation) {
        let nat_size = orientation === Gtk.Orientation.HORIZONTAL ?
            this._natural_width : this._natural_height;
        // gdk_pixbuf_scale_simple infinite loops as size 1 for some reason, so
        // our minimum is 2
        let min = Math.max(this.min_fraction * nat_size, 2);
        let max = Math.max(this.max_fraction * nat_size, min);
        return [min, max];
    },

    vfunc_get_preferred_width: function () {
        return this._get_preferred_size(Gtk.Orientation.HORIZONTAL);
    },

    vfunc_get_preferred_height: function () {
        return this._get_preferred_size(Gtk.Orientation.VERTICAL);
    },

    _animation_timeout: function () {
        if (this._animation_iter === null) {
            this._animation_iter = this._animation.get_iter(null);
        } else {
            this._animation_iter.advance(null);
            this.queue_draw();
        }

        let delay_time = this._animation_iter.get_delay_time();
        if (delay_time > 0) {
            this._animation_callback_source = Mainloop.timeout_add(delay_time, this._animation_timeout.bind(this));
        } else {
            this._reset_animation_timeout();
        }
        return false;
    },

    _reset_animation_timeout: function () {
        this._animation_iter = null;
        this._animation_callback_source = 0;
    },

    _draw_scaled_pixbuf: function (cr) {
        if (this._pixbuf === null)
            return;
        let allocation = this.get_allocation();
        if (this._pixbuf !== this._last_pixbuf || allocation !== this._last_allocation) {
            this._last_pixbuf = this._pixbuf;
            this._last_allocation = allocation;
            let width = Math.min(allocation.width, this.max_fraction * this._natural_width);
            let height = Math.min(allocation.height, this.max_fraction * this._natural_height);

            if (height * this._aspect < width) {
                width = height * this._aspect;
            } else if (width / this._aspect < height) {
                height = width / this._aspect;
            }
            this._scaled_pixbuf = this._pixbuf.scale_simple(width, height, GdkPixbuf.InterpType.BILINEAR);
        }

        let align_extra_space = (extra_space, align) => {
            if (align === Gtk.Align.START)
                return 0;
            if (align === Gtk.Align.END)
                return extra_space;
            return extra_space / 2;
        };
        let x = align_extra_space(allocation.width - this._scaled_pixbuf.width, this.halign);
        let y = align_extra_space(allocation.height - this._scaled_pixbuf.height, this.valign);
        Gdk.cairo_set_source_pixbuf(cr, this._scaled_pixbuf, x, y);
        cr.paint();
    },

    vfunc_unmap: function () {
        if (this._animation_callback_source > 0)
            Mainloop.source_remove(this._animation_callback_source);
        this._reset_animation_timeout();
        this.parent();
    },

    vfunc_draw: function (cr) {
        if (this._animation !== null) {
            if (!this._animation.is_static_image()) {
                if (this._animation_callback_source === 0)
                    this._animation_timeout();
                this._pixbuf = this._animation_iter.get_pixbuf();
            }
            this._draw_scaled_pixbuf(cr);
        }
        // We need to manually call dispose on cairo contexts. This is somewhat related to the bug listed here
        // https://bugzilla.gnome.org/show_bug.cgi?id=685513 for the shell. We should see if they come up with
        // a better fix in the future, i.e. fix this through gjs.
        cr.$dispose();
        return true;
    }
});
