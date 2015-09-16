const GObject = imports.gi.GObject;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;

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
         * Property: lightbox
         * The lightbox widget for this presenter
         *
         * Flags:
         *   Construct only
         */
        'lightbox': GObject.ParamSpec.object('lightbox', 'Lightbox', 'Lightbox',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: factory
         * Factory to create modules
         */
        'factory': GObject.ParamSpec.object('factory', 'Factory', 'Factory',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
    },

    _init: function (props={}) {
        props.engine = props.engine || Engine.Engine.get_default();

        this.parent(props);

        // Lock to ensure we're only loading one lightbox media object at a time
        this._loading_new_lightbox = false;
        this._current_index = -1;
        this._article_model = null;
        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.SHOW_ARTICLE:
                    this._article_model = payload.model;
                    break;
            }
        });

        this.lightbox.connect('navigation-previous-clicked', () => this._on_previous_clicked());
        this.lightbox.connect('navigation-next-clicked', () => this._on_next_clicked());
    },

    show_media_object: function (media_object) {
        return this._preview_media_object(media_object);
    },

    hide_lightbox: function () {
        this.lightbox.reveal_overlays = false;
    },

    _on_previous_clicked: function () {
        this._lightbox_shift_image(-1);
    },

    _on_next_clicked: function () {
        this._lightbox_shift_image(1);
    },

    _lightbox_shift_image: function (delta) {
        if (this._article_model === null)
            return;
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
        if (this._article_model === null)
            return false;
        let resources = this._article_model.resources;
        this._current_index = resources.indexOf(media_object.ekn_id);
        if (this._current_index === -1)
            return false;

        let card = this.factory.create_named_module('lightbox-card', {
            model: media_object
        });
        this.lightbox.lightbox_widget = card;
        this.lightbox.reveal_overlays = true;
        this.lightbox.has_back_button = this._current_index > 0;
        this.lightbox.has_forward_button = this._current_index < resources.length - 1;
        return true;
    },
});
