const GObject = imports.gi.GObject;

const Engine = imports.search.engine;
const MediaCard = imports.app.mediaCard;

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
    },

    _init: function (props={}) {
        props.engine = props.engine || Engine.Engine.get_default();

        this.parent(props);

        // Lock to ensure we're only loading one lightbox media object at a time
        this._loading_new_lightbox = false;
        this._current_index = -1;

        this.view.connect('lightbox-nav-previous-clicked', () => this._on_previous_clicked());
        this.view.connect('lightbox-nav-next-clicked', () => this._on_next_clicked());
    },

    show_media_object: function (article_model, media_object) {
        this._article_model = article_model;
        return this._preview_media_object(media_object);
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
        if (this._loading_new_lightbox)
            return;

        this._loading_new_lightbox = true;
        let new_index = this._current_index + delta;
        let resource_id = this._article_model.resources[new_index];
        this.engine.get_object_by_id(resource_id, null, (engine, task) => {
            this._loading_new_lightbox = false;
            let media_object;
            try {
                media_object = engine.get_object_by_id_finish(task);
            } catch (error) {
                logError(error);
                return;
            }

            // If the next object is not the last, the forward arrow should be displayed.
            this._preview_media_object(media_object);
            this._loading_new_lightbox = false;
        });
    },

    _preview_media_object: function (media_object) {
        let resources = this._article_model.resources;
        this._current_index = resources.indexOf(media_object.ekn_id);
        if (this._current_index === -1)
            return false;

        let media_card = MediaCard.MediaCard.new_from_ekn_model(media_object);
        this.view.lightbox.lightbox_widget = media_card;
        this.view.lightbox.reveal_overlays = true;
        this.view.lightbox.has_back_button = this._current_index > 0;
        this.view.lightbox.has_forward_button = this._current_index < resources.length - 1;
        return true;
    },
});
