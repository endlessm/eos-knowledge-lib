const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const ImagePreviewer = imports.app.widgets.imagePreviewer;
const Knowledge = imports.app.knowledge;
const StyleClasses = imports.app.styleClasses;

/**
 * Class: Previewer
 * Previews an image (and more in the future) in a widget.
 *
 * The API is quite simple, just set the file property to a GFile of the file
 * you would like be previewed. If it is one of the supported types, it will
 * be loaded up for you, if not an error will be thrown.
 */
const Previewer = new Knowledge.Class({
    Name: 'Previewer',
    GTypeName: 'EknPreviewer',
    Extends: Gtk.Bin,
    Properties: {
        /**
         * Property: aspect
         *
         * The aspect aspect the previewer widget should display at
         */
        'aspect': GObject.ParamSpec.float('aspect', 'Aspect',
            'Aspect ratio of previewer content',
            GObject.ParamFlags.READABLE,
            0.00001, 10000.0, 1.0)
    },

    _init: function (props) {
        this._stream = null;
        this._content_type = null;
        this._animating = false;
        this._image_previewer = new ImagePreviewer.ImagePreviewer({
            enforce_minimum_size: true,
            minimum_size: 500,
        });
        this.parent(props);

        this.get_style_context().add_class(StyleClasses.PREVIEWER);
    },

    set_content: function (stream, content_type) {
        if (stream === this._stream) return;

        if (this.get_child() !== null) {
            this.remove(this.get_child());
        }
        this._image_previewer.clear_content();

        this._stream = stream;
        if (this._stream === null) return;

        if (this._image_previewer.supports_type(content_type)) {
            this._image_previewer.set_content(stream);
            this.add(this._image_previewer);
        } else {
            throw new Error('Previewer does not support type ' + content_type);
        }
    },

    get aspect () {
        let child = this.get_child();
        if (child !== null) {
            return child.aspect;
        }
        return 1.0;
    }
});
