// Copyright 2016 Endless Mobile, Inc.

/* exported MeshHistoryStore */

const GObject = imports.gi.GObject;

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const HistoryItem = imports.app.historyItem;
const HistoryStore = imports.app.historyStore;
const MediaObjectModel = imports.search.mediaObjectModel;
const Pages = imports.app.pages;
const Utils = imports.app.utils;

/**
 * Class: MeshHistoryStore
 *
 */
const MeshHistoryStore = new GObject.Class({
    Name: 'MeshHistoryStore',
    Extends: HistoryStore.HistoryStore,

    _init: function (props={}) {
        this.parent(props);

        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.HOME_CLICKED:
                    this.set_current_item_from_props({
                        page_type: Pages.HOME,
                    });
                    break;
                case Actions.SET_CLICKED:
                    this.set_current_item_from_props({
                        page_type: Pages.SET,
                        model: payload.model,
                    });
                    break;
                case Actions.ITEM_CLICKED:
                case Actions.SEARCH_CLICKED:
                    this.set_current_item_from_props({
                        page_type: Pages.ARTICLE,
                        model: payload.model,
                    });
                    break;
                case Actions.NAV_BACK_CLICKED:
                    let item = this.get_current_item();
                    let types = item.page_type === Pages.ARTICLE ?
                        [Pages.HOME, Pages.SET, Pages.SEARCH] : [Pages.HOME];
                    let target_item = this.search_backwards(-1, (item) => types.indexOf(item.page_type) >= 0);
                    if (!target_item)
                        target_item = { page_type: Pages.HOME };
                    this.set_current_item(HistoryItem.HistoryItem.new_from_object(target_item));
                    break;
                case Actions.AUTOCOMPLETE_CLICKED:
                    this.set_current_item_from_props({
                        page_type: Pages.ARTICLE,
                        model: payload.model,
                        query: payload.query,
                    });
                    break;
                case Actions.SEARCH_TEXT_ENTERED:
                    this._do_search(payload.query);
                    break;
                case Actions.ARTICLE_LINK_CLICKED:
                    this._show_ekn_id(payload.ekn_id);
                    break;
            }
        });
    },

    _do_search: function (query) {
        let sanitized_query = Utils.sanitize_query(query);
        if (sanitized_query.length === 0)
            return;

        Utils.record_search_metric(query);
        this.set_current_item_from_props({
            page_type: Pages.SEARCH,
            query: sanitized_query,
        });
    },

    _show_ekn_id: function (ekn_id) {
        Engine.get_default().get_object_by_id(ekn_id, null, (engine, task) => {
            let model;
            try {
                model = engine.get_object_by_id_finish(task);
            } catch (error) {
                logError(error);
                return;
            }

            if (model instanceof ArticleObjectModel.ArticleObjectModel) {
                this.set_current_item_from_props({
                    page_type: Pages.ARTICLE,
                    model: model,
                });
            } else if (model instanceof MediaObjectModel.MediaObjectModel) {
                Dispatcher.get_default().dispatch({
                    action_type: Actions.SHOW_MEDIA,
                    model: model,
                });
            }
        });
    },
});
