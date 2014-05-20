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

    _PLAY_ICON: 'media-playback-start-symbolic',
    _PAUSE_ICON: 'media-playback-pause-symbolic',
    _ICON_SIZE: 50,

    _init: function (props) {
        this._video_texture = new ClutterGst.VideoTexture({
            x_expand: true,
            y_expand: true
        });
        this._video_texture.connect('size-change', Lang.bind(this, this._texture_size_changed));

        let toolbar = this._build_toolbar();
        let toolbar_actor = new GtkClutter.Actor({
            contents: toolbar,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.END,
            y_expand: true
        });

        this.parent(props);

        this._file = null;
        this._aspect = 1.0;
        this._natural_width = 0;

        this._embed = new GtkClutter.Embed();

        let stage = this._embed.get_stage();
        stage.set_layout_manager(new Clutter.BinLayout());
        stage.add_child(this._video_texture);
        stage.add_child(toolbar_actor);

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
        if (this._file !== null) {
            this._can_play = false;
            this._video_texture.playing = false;
        }
    },

    /**
     * Method: show_video
     *
     * Called by the toplevel previewer when done animating.
     */
    show_video: function () {
        this.visible_child = this._embed;
        if (this._file !== null)
            this._can_play = true;
    },

    set file (v) {
        if (v === this._file)
            return;
        this._file = v;
        this._video_texture.playing = false;
        this._video_texture.set_uri(this._file === null ? '' : this._file.get_uri());
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

    _build_toolbar: function () {
        this._pause_play_image = new Gtk.Image({
            pixel_size: this._ICON_SIZE
        });
        let button = new Gtk.Button({
            image: this._pause_play_image,
            halign: Gtk.Align.CENTER
        });
        button.get_style_context().add_class(EosKnowledge.STYLE_CLASS_VIDEO_PLAYER_PLAY_BUTTON);
        button.connect('clicked', function () {
            this._video_texture.set_playing(this._can_play &&
                                            this._pause_play_image.icon_name === this._PLAY_ICON);
            this._update_pause_play_icon();
        }.bind(this));

        let adjustment = new Gtk.Adjustment({
            lower: 0,
            value: 0,
            upper: 1
        });
        this._scale = new Gtk.Scale({
            width_request: 200,
            draw_value: false,
            adjustment: adjustment
        });
        this._scale.get_style_context().add_class(EosKnowledge.STYLE_CLASS_VIDEO_PLAYER_SCALE);
        this._user_update_to_scale = true;
        this._scale.connect('value-changed', function () {
            // Only set progress from scale if the user has moved the scale,
            // otherwise we will loop scale updating progress updating scale.
            if (this._user_update_to_scale)
                this._video_texture.progress = this._scale.adjustment.value;
        }.bind(this));
        this._video_texture.connect('notify::progress', function () {
            this._user_update_to_scale = false;
            this._scale.adjustment.value = this._video_texture.progress;
            this._user_update_to_scale = true;
        }.bind(this));
        this._video_texture.connect('notify::playing', function () {
            this._update_pause_play_icon();
        }.bind(this));
        this._video_texture.connect('eos', function () {
            this._update_pause_play_icon();
            this._video_texture.progress = 0;
        }.bind(this));

        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.HORIZONTAL
        });
        grid.add(button);
        grid.add(this._scale);
        grid.show_all();
        return grid;
    },

    _update_pause_play_icon: function () {
        if (this._video_texture.get_playing()) {
            this._pause_play_image.icon_name = this._PAUSE_ICON;
        } else {
            this._pause_play_image.icon_name = this._PLAY_ICON;
        }
    }
});
