// Copyright 2015 Endless Mobile, Inc.

/* exported SuggestedArticlesModule */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

/**
 * Class: SuggestedArticlesModule
 * A module that displays all suggested articles as cards in an arrangement.
 *
 * Slots:
 *   arrangement
 */
const SuggestedArticlesModule = new Lang.Class({
    Name: 'SuggestedArticlesModule',
    GTypeName: 'EknSuggestedArticlesModule',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/suggestedArticlesModule.ui',

    _init: function (props={}) {
        this.parent(props);
        let arrangement = this.create_submodule('arrangement');
        arrangement.connect('card-clicked', (arrangement, model) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: arrangement.get_models(),
            });
        });
        this.add(arrangement);

        let dispatcher = Dispatcher.get_default();
        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.CLEAR_SUGGESTED_ARTICLES:
                    arrangement.clear();
                    break;
                case Actions.APPEND_SUGGESTED_ARTICLES:
                    payload.models.forEach(arrangement.add_model, arrangement);
                    break;
            }
        });
    },

    // Module override
    get_slot_names: function () {
        return ['arrangement'];
    },
});
