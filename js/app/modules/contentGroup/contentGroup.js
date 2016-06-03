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
        'selection': {},
        'title': {},
    },

    _init: function (props={}) {
        this.parent(props);

        this._title = this.create_submodule('title');
        this.attach(this._title, 0, 0, 1, 1);
        this._arrangement = this.create_submodule('arrangement');
        this._arrangement.connect('card-clicked', (arrangement, model) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: this._selection.get_models(),
            });
        });
        this.attach(this._arrangement, 0, 1, 1, 1);

        this._selection = this.create_submodule('selection');
        this._selection.connect('models-changed',
            this._on_models_changed.bind(this));

        // These two lines are just to demonstrate getting something on screen.
        // They will be replaced by the generic MAKE_READY method on the module interface.
        this.load();
        this._title.make_ready();
    },

    get_selection: function () {
        return this._selection;
    },

    _on_models_changed: function () {
        let models = this._selection.get_models();
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
        this._selection.queue_load_more(cards_to_load);
    },
});
