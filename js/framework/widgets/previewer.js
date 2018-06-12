const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ImagePreviewer = imports.framework.widgets.imagePreviewer;
const Knowledge = imports.framework.knowledge;

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

/**
 * Class: Previewer
 * Previews an image (and more in the future) in a widget.
 *
 * The API is quite simple, just set the file property to a GFile of the file
 * you would like be previewed. If it is one of the supported types, it will
 * be loaded up for you, if not an error will be thrown.
 */
var Previewer = new Knowledge.Class({
    Name: 'Previewer',
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
        this.parent(props);

        this.get_style_context().add_class('previewer');
    },

    _clear: function () {
        if (this._image_previewer)
          this._image_previewer.clear_content();

        if (this._media_player)
          this._media_player.stop();

        if (this.get_child() !== null) {
            this.remove(this.get_child());
        }

        this._stream = null;
    },

    set_uri: function (uri, content_type) {
        this._clear();

        if (uri === null)
            return;

        if (content_type.startsWith('video/') ||
            content_type.startsWith('audio/')) {
            if (!this._media_player)
                this._media_player = new EosKnowledgePrivate.MediaBin();

            this.add(this._media_player);
            this._media_player.set_uri(uri);
        } else {
            let file = Gio.File.new_for_uri(uri);

            if (!this._image_previewer)
                this._image_previewer = new ImagePreviewer.ImagePreviewer({
                    enforce_minimum_size: true,
                    minimum_size: 500,
                });

            this._stream = file.read(null);

            if (this._image_previewer.supports_type(content_type)) {
                this._image_previewer.set_content(this._stream);
                this.add(this._image_previewer);
            } else {
                throw new Error('Previewer does not support type ' + content_type);
            }
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
