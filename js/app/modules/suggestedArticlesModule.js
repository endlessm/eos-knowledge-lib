// Copyright 2015 Endless Mobile, Inc.

/* exported SuggestedArticlesModule */

const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Actions = imports.app.actions;
const CardContainer = imports.app.modules.cardContainer;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

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
    Extends: CardContainer.CardContainer,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        props.title = _("You might be interested in...");
        this.parent(props);

        this.get_style_context().add_class(StyleClasses.SUGGESTED_ARTICLES);

        let dispatcher = Dispatcher.get_default();
        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.CLEAR_SUGGESTED_ARTICLES:
                    this.arrangement.clear();
                    break;
                case Actions.APPEND_SUGGESTED_ARTICLES:
                    payload.models.forEach(this.arrangement.add_model, this.arrangement);
                    break;
            }
        });
    },

    // Module override
    get_slot_names: function () {
        return ['arrangement'];
    },
});
