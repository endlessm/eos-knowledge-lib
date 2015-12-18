const Cairo = imports.cairo;
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

        this._stream = null;
        this._pixbuf = null;
    },

    set_content: function (stream) {
        this._stream = stream;
        this.queue_draw();
    },

    _ensure_surface: function () {
        if (!this._stream)
            return;

        let allocation = this.get_allocation();
        if (this._surface && this._last_width === allocation.width && this._last_height === allocation.height)
            return;
        this._last_width = allocation.width;
        this._last_height = allocation.height;

        if (!this._pixbuf)
            this._pixbuf = GdkPixbuf.Pixbuf.new_from_stream(this._stream, null);

        this._surface = this.get_window().create_similar_surface(Cairo.Content.COLOR, allocation.width, allocation.height);
        let cr = new Cairo.Context(this._surface);

        // Helps to read these transforms in reverse. We center the pixbuf at
        // the origin, scale it to cover, then translate its center to the
        // center of our allocation.
        cr.translate(allocation.width / 2, allocation.height / 2);
        let scale = Math.max(allocation.width / this._pixbuf.get_width(),
                             allocation.height / this._pixbuf.get_height());
        cr.scale(scale, scale);
        cr.translate(-this._pixbuf.get_width() / 2, -this._pixbuf.get_height() / 2);

        Gdk.cairo_set_source_pixbuf(cr, this._pixbuf, 0, 0);
        cr.paint();
        cr.$dispose();
    },

    vfunc_unmap: function () {
        this.parent();
        // Free our cached surface when we unmap. Keeping it around could
        // improve performance in some cases, at the cost of memory footprint.
        this._surface = null;
    },

    vfunc_draw: function (cr) {
        this._ensure_surface();
        if (!this._surface)
            return true;

        cr.setSourceSurface(this._surface, 0, 0);
        cr.paint();
        // We need to manually call dispose on cairo contexts. This is somewhat related to the bug listed here
        // https://bugzilla.gnome.org/show_bug.cgi?id=685513 for the shell. We should see if they come up with
        // a better fix in the future, i.e. fix this through gjs.
        cr.$dispose();
        return true;
    }
});
