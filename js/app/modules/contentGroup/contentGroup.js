/* exported ContentGroup */

// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;

const BATCH_SIZE = 15;

const ContentGroup = new Module.Class({
    Name: 'ContentGroup',
    Extends: Gtk.Grid,

    Slots: {
        'arrangement': {},
    },
    References: {
        'collection': {},
    },

    _init: function (props={}) {
        this.parent(props);

        this._arrangement = this.create_submodule('arrangement');
        this._arrangement.connect('card-clicked', (arrangement, model) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: this._collection.get_models(),
            });
        });
        this.add(this._arrangement);

        this.reference_module('collection', (collection) => {
            this._collection = collection;
            this._collection.connect('models-changed',
                this._on_models_changed.bind(this));
        });
    },

    _on_models_changed: function () {
        let models = this._collection.get_models();
        let max_cards = this._arrangement.get_max_cards();
        if (max_cards > -1)
            models.splice(max_cards);
        this._arrangement.set_models(models);
    },

    load: function () {
        let cards_to_load = BATCH_SIZE;
        let max_cards = this._arrangement.get_max_cards();
        if (max_cards > -1)
            cards_to_load = max_cards;
        this._collection.load_more(cards_to_load);
    },
});
