const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const HistoryStore = imports.app.historyStore;
const Lightbox = imports.app.widgets.lightbox;
const Module = imports.app.interfaces.module;
const Pages = imports.app.pages;

/**
 * Class: MediaLightbox
 *
 * A module which displays media content over other
 *
 * Slots:
 *   card
 */
const MediaLightbox = new Module.Class({
    Name: 'ContentGroup.MediaLightbox',
    Extends: Lightbox.Lightbox,

    Slots: {
        'card': {
            multi: true,
        },
    },

    _init: function (props={}) {
        this.parent(props);

        // Lock to ensure we're only loading one lightbox media object at a time
        this._loading_new_lightbox = false;
        this._current_index = -1;
        this._article_model = null;

        HistoryStore.get_default().connect('changed',
            this._on_history_changed.bind(this));

        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.SHOW_MEDIA:
                    this._preview_media_object(payload.model);
                    break;
                case Actions.HIDE_MEDIA:
                    this.reveal_overlays = false;
                    break;
            }
        });

        this.connect('navigation-previous-clicked', () => this._on_previous_clicked());
        this.connect('navigation-next-clicked', () => this._on_next_clicked());
    },

    _on_history_changed: function () {
        let item = HistoryStore.get_default().get_current_item();
        if (item.page_type === Pages.ARTICLE)
            this._article_model = item.model;
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
        Engine.get_default().get_object_by_id(resource_id, null, (engine, task) => {
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
            return;
        let resources = this._article_model.resources;
        this._current_index = resources.indexOf(media_object.ekn_id);
        if (this._current_index === -1)
            return;

        if (this.lightbox_widget)
            this.drop_submodule(this.lightbox_widget);
        let card = this.create_submodule('card', {
            model: media_object
        });
        this.lightbox_widget = card;
        this.reveal_overlays = true;
        this.has_back_button = this._current_index > 0;
        this.has_forward_button = this._current_index < resources.length - 1;
    },
});
