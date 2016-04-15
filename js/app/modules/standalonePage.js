// Copyright 2015 Endless Mobile, Inc.

/* exported StandalonePage */

const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;

/**
 * Class: StandalonePage
 * The standalone article page of the reader app
 *
 * This module is used to display archived articles (that aren't part of the
 * current collection) and also the article page reached from global search.
 *
 * Slots:
 *   card-type - type of <DocumentCard> created to display content
 */
const StandalonePage = new Module.Class({
    Name: 'StandalonePage',
    GTypeName: 'EknStandalonePage',
    CssName: 'EknStandalonePage',
    Extends: Gtk.Frame,

    _init: function (props={}) {
        this.parent(props);
        this._model = null;
        this._document_card = null;

        Dispatcher.get_default().register(payload => {
            switch (payload.action_type) {
                case Actions.SHOW_ARTICLE:
                    if (payload.archived)
                        this._display_model(payload.model);
                    break;
            }
        });
    },

    // Module override
    get_slot_names: function () {
        return ['card-type'];
    },

    _display_model: function (model) {
        if (this._model === model)
            return;
        if (this._document_card) {
            this.remove(this._document_card);
            this._document_card = null;
        }

        this._model = model;
        if (!this._model)
            return;

        this._document_card = this.create_submodule('card-type', {
            model: model,
            archived: true,
        });
        this.add(this._document_card);
        this._document_card.show_all();
        this._document_card.connect('ekn-link-clicked', (card, uri) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.ARTICLE_LINK_CLICKED,
                ekn_id: uri,
            });
        });
        this._document_card.load_content(null, (card, task) => {
            try {
                card.load_content_finish(task);
            } catch (error) {
                logError(error);
                Dispatcher.get_default().dispatch({
                    action_type: Actions.ARTICLE_LOAD_FAILED,
                });
            }
        });
    },
});
