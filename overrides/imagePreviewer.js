const Gdk = imports.gi.Gdk;
const GdkPixbuf = imports.gi.GdkPixbuf;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

/**
 * Class: ImagePreviewer
 *
 * A private class used by the Previewer. Will display an image in a widget.
 * Unlike GtkImage this widget will size down its image to the available
 * space, which is where most of the complexity in this class comes from.
 */
const ImagePreviewer = Lang.Class({
    Name: 'ImagePreviewer',
    GTypeName: 'EknImagePreviewer',
    Extends: Gtk.Widget,
    Properties: {
        /**
         * Property: file
         *
         * Just like file on the Previewer widget it self. Sets the GFile to
         * be previewed.
         */
        'file': GObject.ParamSpec.object('file', 'File', 'File to preview',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE | GObject.ParamFlags.CONSTRUCT,
            GObject.Object),
    },

    _init: function (props) {
        props = props || {};
        props["app-paintable"] = true;
        this.parent(props);
        this.set_has_window(false);

        this._file = null;
        this._pixbuf = null;
        this._aspect = 1.0;
        this._natural_width = 0;
        this._last_file = null;
        this._last_allocation = null;

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

    set file (v) {
        if (v === this._file)
            return;
        this._file = v;
        if (this._file === null)
            return;

        let pixbuf = this._load_pixbuf();
        this._natural_width = pixbuf.get_width();
        this._aspect = pixbuf.get_width() / pixbuf.get_height();
        this.queue_draw();

        this.notify('file');
    },

    get file () {
        return this._file;
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        return [0, this._natural_width];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        let height = width / this._aspect;
        return [height, height];
    },

    _load_pixbuf: function () {
        return this._load_pixbuf_at_size(-1, -1);
    },

    _load_pixbuf_at_size: function (width, height) {
        // GdkPixbuf.Pixbuf has not from_uri methods so we are stuck checking
        // the scheme ourselves
        let scheme = this._file.get_uri_scheme();
        if (scheme === "file") {
            return GdkPixbuf.Pixbuf.new_from_file_at_scale(this._file.get_path(),
                                                           width,
                                                           height,
                                                           true);
        } else if (scheme === "resource") {
            let resource = this._file.get_uri().split("resource://")[1];
            return GdkPixbuf.Pixbuf.new_from_resource_at_scale(resource,
                                                               width,
                                                               height,
                                                               true);
        }
        return null;
    },

    _update_pixbuf: function () {
        if (this._file === null) {
            this._pixbuf = null;
            return;
        }
        let allocation = this.get_allocation();
        if (this._file === this._last_file && allocation === this._last_allocation)
            return;
        this._last_file = this._file;
        this._last_allocation = allocation;
        this._pixbuf = this._load_pixbuf_at_size(allocation.width, allocation.height);
    },

    vfunc_draw: function (cr) {
        this._update_pixbuf();
        if (this._pixbuf !== null) {
            let allocation = this.get_allocation();
            // Center the pixbuf in the allocation
            let x = (allocation.width - this._pixbuf.width) / 2;
            let y = (allocation.height - this._pixbuf.height) / 2;
            Gdk.cairo_set_source_pixbuf(cr, this._pixbuf, x, y);
            cr.paint();
        }
        // We need to manually call dispose on cairo contexts. This is somewhat related to the bug listed here
        // https://bugzilla.gnome.org/show_bug.cgi?id=685513 for the shell. We should see if they come up with
        // a better fix in the future, i.e. fix this through gjs.
        cr.$dispose();
        return true;
    }
});
