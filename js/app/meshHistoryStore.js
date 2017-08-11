// Copyright 2016 Endless Mobile, Inc.

/* exported MeshHistoryStore */

const Eknc = imports.gi.EosKnowledgeContent;
const Gdk = imports.gi.Gdk;
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
var MeshHistoryStore = new GObject.Class({
    Name: 'MeshHistoryStore',
    Extends: HistoryStore.HistoryStore,

    _init: function (props={}) {
        this.parent(props);

        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.HOME_CLICKED:
                case Actions.LAUNCHED_FROM_DESKTOP:
                    this.set_current_item_from_props({
                        page_type: Pages.HOME,
                        timestamp: payload.timestamp || Gdk.CURRENT_TIME,
                    });
                    break;
                case Actions.ITEM_CLICKED: {
                    let props = { model: payload.model };
                    if (payload.model instanceof Eknc.SetObjectModel)
                        props['page_type'] = Pages.SET;
                    else
                        props['page_type'] = Pages.ARTICLE;
                    if (payload.query)
                        props['query'] = payload.query;
                    this.set_current_item_from_props(props);
                }
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
                case Actions.LIGHTBOX_CLOSED:
                case Actions.SEARCH_BOX_FOCUSED:
                    this.close_lightbox();
                    break;
                case Actions.SEARCH_TEXT_ENTERED:
                case Actions.DBUS_LOAD_QUERY_CALLED:
                    this.do_search(payload.query,
                        payload.timestamp || Gdk.CURRENT_TIME);
                    break;
                case Actions.ARTICLE_LINK_CLICKED:
                    this.show_ekn_id(payload.ekn_id);
                    break;
                case Actions.DBUS_LOAD_ITEM_CALLED:
                    this.load_dbus_item(payload.ekn_id, payload.query,
                        payload.timestamp || Gdk.CURRENT_TIME);
                    break;
            }
        });
    },
});
