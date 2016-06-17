// Copyright 2016 Endless Mobile, Inc.

/* exported MeshHistoryStore */

const GObject = imports.gi.GObject;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const HistoryItem = imports.app.historyItem;
const HistoryStore = imports.app.historyStore;
const Pages = imports.app.pages;

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
                    this.do_search(payload.query);
                    break;
                case Actions.ARTICLE_LINK_CLICKED:
                    this.show_ekn_id(payload.ekn_id);
                    break;
            }
        });
    },
});
