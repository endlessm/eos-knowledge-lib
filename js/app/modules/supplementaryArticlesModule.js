// Copyright 2016 Endless Mobile, Inc.

/* exported SupplementaryArticlesModule */

const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const CardContainer = imports.app.modules.cardContainer;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: SupplementaryArticlesModule
 * A module that displays all unread articles as cards in an arrangement. If no
 * unread articles are available it will show read articles with the same criteria.
 *
 * Slots:
 *   arrangement
 *   card-type
 */
const SupplementaryArticlesModule = new Lang.Class({
    Name: 'SupplementaryArticlesModule',
    GTypeName: 'EknSupplementaryArticlesModule',
    Extends: CardContainer.CardContainer,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        /**
         * Property: same-set
         *
         * Whether to show articles from the same set or from different sets.
         */
        'same-set':  GObject.ParamSpec.boolean('same-set', 'Show articles from same set',
            'Whether to show articles in the same set',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, true),
    },

    _init: function (props={}) {
        props.title = _("Other news");
        this.parent(props);

        let dispatcher = Dispatcher.get_default();
        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.CLEAR_SUPPLEMENTARY_ARTICLES:
                    this.arrangement.clear();
                    break;
                case Actions.APPEND_SUPPLEMENTARY_ARTICLES:
                    if (payload.same_set !== this.same_set)
                        return;

                    // If we asked for unread articles and didn't get any
                    // try now asking for _read_ articles with the same
                    // criteria
                    if (payload.need_unread && payload.models.length === 0) {
                        dispatcher.dispatch({
                            action_type: Actions.NEED_MORE_SUPPLEMENTARY_ARTICLES,
                            same_set: this.same_set,
                            set_tags: payload.set_tags,
                            need_unread: false,
                        });
                    }
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
