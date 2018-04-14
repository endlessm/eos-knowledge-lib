// Copyright 2016 Endless Mobile, Inc.

/* exported CourseHistoryStore */

const {DModel, Gdk, GObject} = imports.gi;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const EntryPoints = imports.app.entryPoints;
const HistoryItem = imports.app.historyItem;
const HistoryStore = imports.app.historyStore;
const Pages = imports.app.pages;
const SetMap = imports.app.setMap;

/**
 * Class: CourseHistoryStore
 *
 */
var CourseHistoryStore = new GObject.Class({
    Name: 'CourseHistoryStore',
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
                    if (payload.model instanceof DModel.Set) {
                        if (!SetMap.get_parent_set(payload.model)) {
                            let props = { model: payload.model };
                            props['page_type'] = Pages.SET;
                            this.set_current_item_from_props(props);
                            this._load_first_subset(payload.model);
                        } else {
                            this.set_current_subset(payload.model);
                        }
                    } else if (payload.model instanceof DModel.Media) {
                        this.set_current_item_from_props({
                            media_model: payload.model,
                            context: payload.context,
                        }, EntryPoints.LINK_CLICKED);
                    } else {
                        this.set_current_item_from_props({
                            page_type: Pages.ARTICLE,
                            model: payload.model,
                        }, EntryPoints.LINK_CLICKED);
                    }
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
                case Actions.ARTICLE_LINK_CLICKED:
                    this.show_id(payload.id);
                    break;
                case Actions.SEARCH_TEXT_ENTERED:
                case Actions.DBUS_LOAD_QUERY_CALLED:
                    this.do_search(payload.search_terms,
                        payload.timestamp || Gdk.CURRENT_TIME);
                    break;
                case Actions.DBUS_LOAD_ITEM_CALLED:
                    this.load_dbus_item(payload.id, payload.search_terms,
                        payload.timestamp || Gdk.CURRENT_TIME);
                    break;
            }
        });
    },

    _load_first_subset: function (model) {
        let query = new DModel.Query({
            limit: 1,
            tags_match_any: model.child_tags,
            tags_match_all: ['EknSetObject'],
            sort: DModel.QuerySort.SEQUENCE_NUMBER,
        });
        DModel.Engine.get_default().query_promise(query)
        .then((results) => {
            if (results.models.length > 0) {
                this.set_current_subset(results.models[0]);
            }
        })
        .catch(function (error) {
            logError(error);
        });
    },
});
