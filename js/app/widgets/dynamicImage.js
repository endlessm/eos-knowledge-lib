const Gdk = imports.gi.Gdk;
const GdkPixbuf = imports.gi.GdkPixbuf;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Knowledge = imports.app.knowledge;

const MIN_WIDTH = 40;

/**
 * Class: DynamicImage
 */
const dynamicImage = new Knowledge.Class({
    Name: 'DynamicImage',
    Extends: Gtk.Widget,

    Properties: {
        'image-uri': GObject.ParamSpec.string('image-uri', 'image-uri', 'image-uri',
            GObject.ParamFlags.READWRITE, ''),
    },

    _init: function (props) {
        this.parent(props);
        this._pixbuf = null
        this.set_has_window(false);
    },

    set_content (stream) {
        this._pixbuf = GdkPixbuf.Pixbuf.new_from_stream(stream, null);
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        return [MIN_WIDTH, MIN_WIDTH];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        let scale = width / this._pixbuf.get_width();
        let height = this._pixbuf.get_height() * scale;
        return [height, height];
    },

    vfunc_draw: function (cr) {
        let alloc = this.get_allocation();
        let scale = alloc.width / this._pixbuf.get_width();
        cr.scale(scale, scale);
        Gdk.cairo_set_source_pixbuf(cr, this._pixbuf, 0, 0);
        cr.paint();
    },
});
