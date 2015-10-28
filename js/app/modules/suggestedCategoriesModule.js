// Copyright 2015 Endless Mobile, Inc.

/* exported SuggestedCategoriesModule */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

/**
 * Class: SuggestedCategoriesModule
 * A module that displays all suggested articles as cards in an arrangement.
 *
 * CSS classes:
 *   browse-categories-title - on the "Browse Categories" title
 *
 * Slots:
 *   arrangement
 *   card-type
 */
const SuggestedCategoriesModule = new Lang.Class({
    Name: 'SuggestedCategoriesModule',
    GTypeName: 'EknSuggestedCategoriesModule',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        /**
         * Property: featured-only
         * Show only featured models in the arrangement
         *
         * FIXME: This should be turned into a filter module that can be added
         * to the arrangement.
         *
         * Default value:
         *   false
         */
        'featured-only': GObject.ParamSpec.boolean('featured-only',
            'Featured only', 'Show only featured models in the arrangement',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
        /**
         * Property: show-title
         * Whether to show the title at the top
         *
         * Default value:
         *   true
         */
        'show-title': GObject.ParamSpec.boolean('show-title',
            'Show title', 'Whether to show the title at the top',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            true),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/suggestedCategoriesModule.ui',
    InternalChildren: [ 'title' ],

    _init: function (props={}) {
        this.parent(props);
        this._arrangement = this.create_submodule('arrangement');
        this.add(this._arrangement);

        if (!this.show_title) {
            this._title.no_show_all = true;
            this._title.hide();
        }

        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.APPEND_SETS:
                    // Use the sets generated on app startup to populate the
                    // suggested categories module.
                    let models = payload.models;
                    if (this.featured_only)
                        models = models.filter(model => model.featured);
                    models.forEach(this._add_card, this);
                    break;
                case Actions.CLEAR_SETS:
                    this._arrangement.clear();
                    break;
            }
        });
    },

    // Module override
    get_slot_names: function () {
        return ['arrangement', 'card-type'];
    },

    _add_card: function (model) {
        let card = this.create_submodule('card-type', {
            model: model,
        });
        card.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SET_CLICKED,
                model: model,
            });
        });
        this._arrangement.add_card(card);
    },
});
