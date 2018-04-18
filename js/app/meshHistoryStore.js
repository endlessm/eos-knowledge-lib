// Copyright 2016 Endless Mobile, Inc.

/* exported MeshHistoryStore */

const {DModel, Gdk, GObject} = imports.gi;
const Gettext = imports.gettext;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const EntryPoints = imports.app.entryPoints;
const HistoryItem = imports.app.historyItem;
const HistoryStore = imports.app.historyStore;
const Pages = imports.app.pages;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

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
                case Actions.ALL_SETS_CLICKED:
                    this.set_current_item_from_props({
                        page_type: Pages.ALL_SETS,
                    });
                    break;
                case Actions.ITEM_CLICKED:
                    let search_terms = '';
                    if (payload.search_terms)
                        search_terms = payload.search_terms;

                    if (payload.model instanceof DModel.Set) {
                        this.set_current_item_from_props({
                            page_type: Pages.SET,
                            model: payload.model,
                            context_label: payload.model.title,
                            search_terms: search_terms,
                        });
                    } else {
                        let context_label = '';
                        if (payload.search_terms) {
                            context_label = _("Results were found for “%s”").format(payload.search_terms);
                        } else if (payload.context_label) {
                            context_label = payload.context_label;
                        }
                        this.set_current_item_from_props({
                            page_type: Pages.ARTICLE,
                            model: payload.model,
                            context: payload.context,
                            context_label: context_label,
                            search_terms: search_terms,
                        }, EntryPoints.LINK_CLICKED);
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
                    this.do_search(payload.search_terms,
                        payload.timestamp || Gdk.CURRENT_TIME);
                    break;
                case Actions.ARTICLE_LINK_CLICKED:
                    this.show_id(payload.id);
                    break;
                case Actions.DBUS_LOAD_ITEM_CALLED:
                    this.load_dbus_item(payload.id, payload.search_terms,
                        payload.timestamp || Gdk.CURRENT_TIME);
                    break;
            }
        });
    },
});
