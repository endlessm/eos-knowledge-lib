const Gdk = imports.gi.Gdk;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

/**
 * Class: ImageCoverFrame
 *
 * A widget to mimic the CSS 'background-size:cover;'
 * effect on images. The image is scaled to cover the entire
 * space it is allocated and then centered.
 *
 */
const ImageCoverFrame = Lang.Class({
    Name: 'ImageCoverFrame',
    GTypeName: 'EknImageCoverFrame',
    Extends: Gtk.Widget,

    _init: function (props={}) {
        props.visible = true;
        this.parent(props);
        this.set_has_window(false);

        this._aspect = 1.0;
        this._stream = null;
        this._pixbuf = null;
    },

    set_content: function (stream) {
        this._stream = stream;
        this.queue_draw();
    },

    _ensure_pixbuf: function () {
        if ((!this._stream) || this._pixbuf)
            return;
        this._pixbuf = GdkPixbuf.Pixbuf.new_from_stream(this._stream, null);
        this._aspect = this._pixbuf.get_width() / this._pixbuf.get_height();
    },

    // Scales the image to the right dimensions so that it covers the
    // allocated space while still maintaining its aspect ratio.
    // Make it a public function so we can test it independently.
    get_scaled_dimensions: function (aspect, allocated_width, allocated_height) {
        let height = Math.max(allocated_width / aspect, allocated_height);
        let width = height * aspect;
        return [Math.round(width), Math.round(height)];
    },

    _draw_scaled_pixbuf: function (cr) {
        if (!this._stream)
            return;
        this._ensure_pixbuf();
        let allocation = this.get_allocation();
        let [width, height] = this.get_scaled_dimensions(this._aspect, allocation.width, allocation.height);
        let scaled_pixbuf = this._pixbuf.scale_simple(width, height, GdkPixbuf.InterpType.BILINEAR);

        // Position the image in the center
        let x = (allocation.width / 2) - width / 2;
        let y = (allocation.height / 2) - height / 2;
        Gdk.cairo_set_source_pixbuf(cr, scaled_pixbuf, x, y);
        cr.paint();
    },

    vfunc_draw: function (cr) {
        this._draw_scaled_pixbuf(cr);
        // We need to manually call dispose on cairo contexts. This is somewhat related to the bug listed here
        // https://bugzilla.gnome.org/show_bug.cgi?id=685513 for the shell. We should see if they come up with
        // a better fix in the future, i.e. fix this through gjs.
        cr.$dispose();
        return true;
    }
});
