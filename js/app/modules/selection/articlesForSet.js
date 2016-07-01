/* exported ArticlesForSet */

// Copyright 2016 Endless Mobile, Inc.

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const SetObjectModel = imports.search.setObjectModel;
const Xapian = imports.app.modules.selection.xapian;

const ArticlesForSet = new Module.Class({
    Name: 'ArticlesForSetSelection',
    Extends: Xapian.Xapian,

    _init: function (props) {
        this.parent(props);

        if (this.global) {
            let item = HistoryStore.get_default().get_current_item();
            if (item && item.model instanceof SetObjectModel.SetObjectModel)
                this.model = item.model;
            HistoryStore.get_default().connect('changed',
                this._on_history_changed_global.bind(this));
        }
    },

    _on_history_changed_global: function () {
        let item = HistoryStore.get_default().get_current_item();
        if (item.model instanceof SetObjectModel.SetObjectModel &&
            item.model !== this.model) {
            this.clear();
            this.model = item.model;
        }
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;
        if (!this.model)
            throw new Error('You should not be loading this selection unless on the set page');

        return new QueryObject.QueryObject({
            limit: limit,
            tags_match_any: this.model.child_tags,
            tags_match_all: ['EknArticleObject'],
        });
    },

    show_more: function () {
        Dispatcher.get_default().dispatch({
            action_type: Actions.ITEM_CLICKED,
            model: this.model,
            context_label: this.model.title,
        });
    },
});
