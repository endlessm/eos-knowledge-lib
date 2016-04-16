// Copyright 2015 Endless Mobile, Inc.

/* exported SuggestedArticlesModule */

const Gettext = imports.gettext;

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
 */
const SuggestedArticlesModule = new Module.Class({
    Name: 'SuggestedArticlesModule',
    GTypeName: 'EknSuggestedArticlesModule',
    CssName: 'EknSuggestedArticlesModule',
    Extends: CardContainer.CardContainer,

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
});
