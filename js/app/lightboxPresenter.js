const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;

const Engine = imports.search.engine;
const MediaInfobox = imports.app.mediaInfobox;
const Previewer = imports.app.previewer;

/**
 * Class: LightboxPresenter
 *
 * A presenter for the lightbox functionality to act as a intermediary between
 * an <ArticleObjectModel> and a <Lightbox> object. It connects to signals on the
 * view's widgets and handles those events accordingly.
 *
 * Its properties are an <Engine> and the <Window> that contains the <Lightbox>
 * widget.
 */
const LightboxPresenter = new GObject.Class({
    Name: 'LightboxPresenter',
    GTypeName: 'EknLightboxPresenter',

    Properties: {
        /**
         * Property: engine
         * Handle to EOS knowledge engine
         *
         * Pass an instance of <Engine> to this property.
         * This is a property for purposes of dependency injection during
         * testing.
         *
         * Flags:
         *   Construct only
         */
        'engine': GObject.ParamSpec.object('engine', 'Engine',
            'Handle to EOS knowledge engine',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),

        /**
         * Property: view
         * View that contains the lightbox
         *
         * The <Window> object that contains the <Lightbox> that is being handled
         * by this presenter.
         *
         * Flags:
         *   Construct only
         */
        'view': GObject.ParamSpec.object('view', 'View',
            'The Window object that contains the Lightbox that is being handled.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),

        /**
         * Property: display-infobox
         * Whether the lightbox' infobox should be displayed
         *
         * The <Lightbox> widget provides an infobox area that can display a caption
         * and image credits. This flag toggles its display.
         *
         * Flags:
         *   Construct only
         */
        'display-infobox': GObject.ParamSpec.boolean('display-infobox', 'Display Infobox',
            'Whether the Lightbox needs to display an Infobox when shown. Defaults to "true"',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, true),
    },

    _init: function (props={}) {
        props.engine = props.engine || Engine.Engine.get_default();

        this.parent(props);

        this._previewer = new Previewer.Previewer({
            visible: true,
        });
        this.view.lightbox.content_widget = this._previewer;

        // Lock to ensure we're only loading one lightbox media object at a time
        this._loading_new_lightbox = false;

        this.view.connect('lightbox-nav-previous-clicked', () => this._on_previous_clicked());
        this.view.connect('lightbox-nav-next-clicked', () => this._on_next_clicked());
    },

    show_media_object: function (article_model, media_object) {
        this._article_model = article_model;
        let resources = this._article_model.get_resources();
        let resource_index = resources.indexOf(media_object.ekn_id);
        if (resource_index !== -1) {
            // Checks whether forward/back arrows should be displayed.
            this._preview_media_object(media_object,
                resource_index > 0,
                resource_index < resources.length - 1);
            return true;
        }
        return false;
    },

    hide_lightbox: function () {
        this.view.lightbox.reveal_overlays = false;
    },

    _on_previous_clicked: function () {
        this._lightbox_shift_image(-1);
    },

    _on_next_clicked: function () {
        this._lightbox_shift_image(1);
    },

    _lightbox_shift_image: function (delta) {
        if (typeof this.view.lightbox.media_object === 'undefined' || this._loading_new_lightbox) {
            return;
        }

        let resources = this._article_model.get_resources();
        let current_index = resources.indexOf(this.view.lightbox.media_object.ekn_id);
        if (current_index === -1) {
            return;
        }

        this._loading_new_lightbox = true;
        let new_index = current_index + delta;
        let resource_id = resources[new_index];
        this.engine.get_object_by_id(resource_id, (err, media_object) => {
            this._loading_new_lightbox = false;
            if (typeof err !== 'undefined') {
                printerr(err);
                printerr(err.stack);
                return;
            }

            // If the next object is not the last, the forward arrow should be displayed.
            this._preview_media_object(media_object,
                new_index > 0,
                new_index < resources.length - 1);
            this._loading_new_lightbox = false;
        });
    },

    _preview_media_object: function (media_object, previous_arrow_visible, next_arrow_visible) {
        if (this.display_infobox) {
            let infobox = MediaInfobox.MediaInfobox.new_from_ekn_model(media_object);
            this.view.lightbox.infobox_widget = infobox;
        }

        this._previewer.set_content(media_object.get_content_stream(), media_object.content_type);
        this.view.lightbox.media_object = media_object;
        this.view.lightbox.reveal_overlays = true;
        this.view.lightbox.has_back_button = previous_arrow_visible;
        this.view.lightbox.has_forward_button = next_arrow_visible;
    },
});
