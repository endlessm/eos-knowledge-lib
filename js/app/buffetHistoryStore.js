// Copyright 2016 Endless Mobile, Inc.

/* exported BuffetHistoryStore */

const Gettext = imports.gettext;
const GObject = imports.gi.GObject;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const HistoryStore = imports.app.historyStore;
const Pages = imports.app.pages;
const SetObjectModel = imports.search.setObjectModel;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: BuffetHistoryStore
 *
 */
const BuffetHistoryStore = new GObject.Class({
    Name: 'BuffetHistoryStore',
    Extends: HistoryStore.HistoryStore,

    _init: function (props={}) {
        this.parent(props);

        Dispatcher.get_default().register(payload => {
            switch (payload.action_type) {
                case Actions.HOME_CLICKED:
                    this.set_current_item_from_props({
                        page_type: Pages.HOME,
                    });
                    break;
                case Actions.ALL_SETS_CLICKED:
                    this.set_current_item_from_props({
                        page_type: Pages.ALL_SETS,
                    });
                    break;
                case Actions.SET_CLICKED:
                    this.set_current_item_from_props({
                        page_type: Pages.SET,
                        model: payload.model,
                        context_label: payload.model.title,
                    });
                    break;
                case Actions.AUTOCOMPLETE_CLICKED:
                case Actions.ITEM_CLICKED:
                case Actions.SEARCH_CLICKED:
                    if (payload.model instanceof SetObjectModel.SetObjectModel) {
                        this.set_current_item_from_props({
                            page_type: Pages.SET,
                            model: payload.model,
                        });
                    } else {
                        let context_label = '';
                        if (payload.query) {
                            context_label = _("Results were found for “%s”").format(payload.query);
                        } else if (payload.context_label) {
                            context_label = payload.context_label;
                        }
                        this.set_current_item_from_props({
                            page_type: Pages.ARTICLE,
                            model: payload.model,
                            context: payload.context,
                            context_label: context_label,
                        });
                    }
                    break;
                case Actions.ARTICLE_LINK_CLICKED:
                    this.show_ekn_id(payload.ekn_id);
                    break;
                case Actions.SEARCH_TEXT_ENTERED:
                    this.do_search(payload.query);
                    break;
                case Actions.PREVIOUS_DOCUMENT_CLICKED:
                case Actions.NEXT_DOCUMENT_CLICKED:
                    let item = this.get_current_item();
                    this.set_current_item_from_props({
                        page_type: Pages.ARTICLE,
                        model: payload.model,
                        context: item.context,
                    });
                    break;
            }
        });
    },
});
