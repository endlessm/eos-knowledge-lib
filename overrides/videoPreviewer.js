const Clutter = imports.gi.Clutter;
const ClutterGst = imports.gi.ClutterGst;
const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const GtkClutter = imports.gi.GtkClutter;
const Lang = imports.lang;


/**
 * Class: VideoPreviewer
 *
 * A private class used by the Previewer. Will display a video in a widget.
 * Uses GtkClutter to embed a ClutterGst video player.
 */
const VideoPreviewer = Lang.Class({
    Name: 'VideoPreviewer',
    GTypeName: 'EknVideoPreviewer',
    Extends: Gtk.Stack,
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
        this._video_texture = new ClutterGst.VideoTexture({
            x_expand: true,
            y_expand: true
        });
        this._video_texture.connect('size-change', Lang.bind(this, this._texture_size_changed));

        this.parent(props);

        this._file = null;
        this._aspect = 1.0;
        this._natural_width = 0;

        this._embed = new GtkClutter.Embed();

        let stage = this._embed.get_stage();
        stage.set_layout_manager(new Clutter.BinLayout());
        stage.add_child(this._video_texture);

        this._frame = new Gtk.Frame();
        this._frame.get_style_context().add_class(EosKnowledge.STYLE_CLASS_ANIMATING_VIDEO_FRAME);

        this.add(this._embed);
        this.add(this._frame);
        this.show_all();
    },

    /**
     * Method: supports_type
     *
     * True if the given mime type is supported by the video previewer.
     */
    supports_type: function (type) {
        // Someday we might want to actually translate from gstreamer caps to
        // glib mime types. For now we will just support any mime type that
        // starts with video/
        return type.indexOf('video/') === 0;
    },

    /**
     * Method: hide_video
     *
     * Called by the toplevel previewer when animating. Because ClutterGtk
     * does not play well with stack or revealer animations we need to hide
     * the video while the animation is ongoing.
     */
    hide_video: function () {
        this.visible_child = this._frame;
        if (this._file !== null)
            this._video_texture.playing = false;
    },

    /**
     * Method: show_video
     *
     * Called by the toplevel previewer when done animating.
     */
    show_video: function () {
        this.visible_child = this._embed;
        if (this._file !== null)
            this._video_texture.playing = true;
    },

    set file (v) {
        if (v === this._file)
            return;
        this._file = v;
        this._video_texture.playing = false;
        if (this._file === null)
            return;

        this._video_texture.set_uri(this._file.get_uri());
        this._video_texture.playing = true;

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

    vfunc_size_allocate: function (alloc) {
        // Always center widget in available allocation, in case the alloc is
        // the wrong ratio. Since this widget is in an overlay with a size
        // request thats ignored, this does come up
        let alloc_aspect = alloc.width / alloc.height;
        if (alloc_aspect < this._aspect) {
            let new_height = alloc.width / this._aspect;
            alloc.y += (alloc.height - new_height) / 2;
            alloc.height = new_height;
        } else {
            let new_width = alloc.height * this._aspect;
            alloc.x += (alloc.width - new_width) / 2;
            alloc.width = new_width;
        }
        this.parent(alloc);
    },

    _texture_size_changed: function (texture, width, height) {
        this._natural_width = width;
        this._aspect = width / height;
        this.queue_resize();
    },
});
