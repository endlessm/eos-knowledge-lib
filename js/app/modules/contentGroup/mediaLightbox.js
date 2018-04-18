const {DModel, Gdk, Gtk} = imports.gi;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const HistoryStore = imports.app.historyStore;
const Lightbox = imports.app.widgets.lightbox;
const Module = imports.app.interfaces.module;
const PDFView = imports.app.widgets.PDFView;
const ShareActionBox = imports.app.widgets.shareActionBox;

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;

/**
 * Class: MediaLightbox
 * A module which displays media content over other
 */
var MediaLightbox = new Module.Class({
    Name: 'ContentGroup.MediaLightbox',
    Extends: Lightbox.Lightbox,

    Slots: {
        'view': {
            multi: true,
        },
        'content': {},
    },

    _init: function (props={}) {
        this.parent(props);

        // Lock to ensure we're only loading one lightbox media object at a time
        this._loading_new_lightbox = false;
        this._current_index = -1;
        this._context = null;

        this.add(this.create_submodule('content'));

        HistoryStore.get_default().connect('changed',
            this._on_history_changed.bind(this));
        this.connect('close-clicked', this._on_close.bind(this));
        this.connect('navigation-previous-clicked', () => this._on_previous_clicked());
        this.connect('navigation-next-clicked', () => this._on_next_clicked());

        this.extra_widget = new ShareActionBox.ShareActionBox ({
            orientation: Gtk.Orientation.VERTICAL
        });
    },

    _on_history_changed: function () {
        let item = HistoryStore.get_default().get_current_item();
        if (item.media_model) {
            this._context = item.context;
            this._preview_media_object(item.media_model);
        } else {
            this.reveal_overlays = false;
        }
    },

    _on_close: function () {
        if (this.lightbox_widget instanceof EosKnowledgePrivate.MediaBin) {
            this.lightbox_widget.stop();
        }
        this.drop_submodule(this.lightbox_widget);
        this.lightbox_widget = null;
        Dispatcher.get_default().dispatch({
            action_type: Actions.LIGHTBOX_CLOSED,
        });
    },

    _on_previous_clicked: function () {
        this._lightbox_shift_image(-1);
    },

    _on_next_clicked: function () {
        this._lightbox_shift_image(1);
    },

    _lightbox_shift_image: function (delta) {
        if (this._context === null)
            return;
        if (this._loading_new_lightbox)
            return;

        this._loading_new_lightbox = true;
        let new_index = this._current_index + delta;
        let resource = this._context[new_index];
        if (resource instanceof DModel.Content) {
            this._preview_media_object(resource);
            this._loading_new_lightbox = false;
        } else {
            DModel.Engine.get_default().get_object_promise(resource)
            .then((media_object) => {
                this._loading_new_lightbox = false;

                // If the next object is not the last, the forward arrow should be displayed.
                this._preview_media_object(media_object);
                this._loading_new_lightbox = false;
            })
            .catch(function (error) {
                logError(error);
            });
        }
    },

    _preview_media_object: function (media_object) {
        if (this._context === null)
            return;
        let resources = this._context;

        this._current_index = resources.map((item) => {
            if (item instanceof DModel.Content) {
                return item.id;
            }
            return item;
        }).indexOf(media_object.id);

        if (this._current_index === -1)
            return;

        if (this.lightbox_widget) {
            if (this.lightbox_widget instanceof EosKnowledgePrivate.MediaBin) {
                this.lightbox_widget.stop();
            }
            this.drop_submodule(this.lightbox_widget);
            this.lightbox_widget = null;
        }

        let widget = this.create_submodule('view', {
            model: media_object
        });

        // Lightboxes may need to show a variety of different content, in which
        // case a single card type may not fit all needs. If no card type is
        // specified, try to determine content type and show it accordingly.
        let content_type = media_object.content_type;
        if (widget === null) {
            if (media_object instanceof DModel.Video) {
                widget = new EosKnowledgePrivate.MediaBin();
                widget.set_uri(media_object.id);
            } else if (content_type === 'application/pdf') {
                let stream = media_object.get_content_stream();
                widget = new PDFView.PDFView({
                    expand: true,
                    // FIXME: PDFView doesn't respond to vexpand:
                    // https://phabricator.endlessm.com/T13216
                    height_request: Gdk.Screen.get_default().get_height(),
                    visible: true,
                });
                widget.load_stream(stream, content_type);
            } else {
                printerr("Lightbox does not support this content type " + content_type);
                return;
            }
        }
        this.lightbox_widget = widget;
        this.reveal_overlays = true;
        this.has_back_button = this._current_index > 0;
        this.has_forward_button = this._current_index < resources.length - 1;
        this.extra_widget.visible = media_object.original_uri && media_object.original_uri.length;
    },
});
