// Copyright 2016 Endless Mobile, Inc.

/* exported BuffetHistoryStore */

const {DModel, Gdk, GObject} = imports.gi;
const Gettext = imports.gettext;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const EntryPoints = imports.app.entryPoints;
const HistoryStore = imports.app.historyStore;
const Pages = imports.app.pages;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: BuffetHistoryStore
 *
 */
var BuffetHistoryStore = new GObject.Class({
    Name: 'BuffetHistoryStore',
    Extends: HistoryStore.HistoryStore,

    _init: function (props={}) {
        this.parent(props);

        Dispatcher.get_default().register(payload => {
            switch (payload.action_type) {
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
                    if (payload.model instanceof DModel.Set) {
                        this.set_current_item_from_props({
                            page_type: Pages.SET,
                            model: payload.model,
                            context_label: payload.model.title,
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
                        }, EntryPoints.LINK_CLICKED);
                    }
                    break;
                case Actions.ARTICLE_LINK_CLICKED:
                    this.show_ekn_id(payload.ekn_id);
                    break;
                case Actions.SEARCH_TEXT_ENTERED:
                case Actions.DBUS_LOAD_QUERY_CALLED:
                    this.do_search(payload.search_terms,
                        payload.timestamp || Gdk.CURRENT_TIME);
                    break;
                case Actions.LIGHTBOX_CLOSED:
                case Actions.SEARCH_BOX_FOCUSED:
                    this.close_lightbox();
                    break;
                case Actions.DBUS_LOAD_ITEM_CALLED:
                    this.load_dbus_item(payload.ekn_id, payload.search_terms,
                        payload.timestamp || Gdk.CURRENT_TIME);
                    break;
            }
        });
    },
});
