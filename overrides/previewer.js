const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ImagePreviewer = imports.imagePreviewer;
const VideoPreviewer = imports.videoPreviewer;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: Previewer
 * Previews a video or image (and more in the future) in a widget.
 *
 * The API is quite simple, just set the file property to a GFile of the file
 * you would like be previewed. If it is one of the supported types, it will
 * be loaded up for you, if not an error will be thrown.
 */
const Previewer = new Lang.Class({
    Name: 'Previewer',
    GTypeName: 'EknPreviewer',
    Extends: Gtk.Bin,
    Properties: {
        /**
         * Property: file
         *
         * The only public API for this widget. A GFile of the file you would
         * like previewed in this widget
         */
        'file': GObject.ParamSpec.object('file', 'File', 'File to preview',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            GObject.Object),
        /**
         * Property: animating
         *
         * True if previewer is animating. Currently only used by the video
         * player which can't display properly during an animation. Will
         * pause the video and show a black box instead.
         */
        'animating': GObject.ParamSpec.boolean('animating', 'Animating',
            'True if previewer is animating',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false),
        /**
         * Property: aspect
         *
         * The aspect aspect the previewer widget should display at
         */
        'aspect': GObject.ParamSpec.float('aspect', 'Aspect',
            'Aspect ratio of previewer content',
            GObject.ParamFlags.READABLE,
            false)
    },

    _init: function (props) {
        this._file = null;
        this._animating = false;
        this._image_previewer = new ImagePreviewer.ImagePreviewer({
            enforce_minimum_size: true,
            minimum_size: 500,
        });
        this._video_previewer = new VideoPreviewer.VideoPreviewer();
        this.parent(props);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_PREVIEWER);
    },

    set animating (v) {
        if (v === this._animating) return;
        this._animating = v;
        if (this._animating) {
            this._video_previewer.hide_video();
        } else {
            this._video_previewer.show_video();
        }
    },

    get animating () {
        return this._animating;
    },

    set file (v) {
        if (v === this._file) return;

        if (this.get_child() !== null) {
            this.remove(this.get_child());
        }
        this._image_previewer.file = null;
        this._video_previewer.file = null;
        this._file = v;
        if (this._file === null) return;

        let type = this._file.query_info('standard::content-type',
                                         Gio.FileQueryInfoFlags.NONE,
                                         null).get_content_type();
        if (this._image_previewer.supports_type(type)) {
            this._image_previewer.file = v;
            this.add(this._image_previewer);
        } else if (this._video_previewer.supports_type(type)) {
            this._video_previewer.file = v;
            this.add(this._video_previewer);
        } else {
            throw new Error('Previewer does not support type ' + type);
        }

        this.notify('file');
    },

    get file () {
        return this._file;
    },

    get aspect () {
        let child = this.get_child();
        if (child !== null) {
            return child.aspect;
        }
        return 1.0;
    }
});
