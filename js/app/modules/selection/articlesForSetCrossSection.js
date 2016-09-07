/* exported ArticlesForSetCrossSection */

// Copyright 2016 Endless Mobile, Inc.

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const SetObjectModel = imports.search.setObjectModel;
const QueryObject = imports.search.queryObject;
const Xapian = imports.app.modules.selection.xapian;

const ArticlesForSetCrossSection = new Module.Class({
    Name: 'Selection.ArticlesForSetCrossSection',
    Extends: Xapian.Xapian,

    _init: function (props={}) {
        this.parent(props);
        this._set_needs_refresh(true);
    },

    // Selection.Xapian implementation
    on_history_changed: function (history) {
        let item = history.get_current_item();
        if (item.model instanceof SetObjectModel.SetObjectModel &&
            item.model !== this._current_set) {
            this._current_set = item.model;
            this._set_needs_refresh(true);
        }
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;

        // XXX update current set if we missed the change for some reason
        if (!this._current_set) {
            let item = HistoryStore.get_default().get_current_item();
            if (item.model instanceof SetObjectModel.SetObjectModel)
                this._current_set = item.model;
        }

        let tags = this.model.child_tags.concat(['EknArticleObject']);
        if (this._current_set)
            tags = tags.concat(this._current_set.child_tags);
        return new QueryObject.QueryObject({
            limit: limit,
            tags_match_all: tags,
            sort: QueryObject.QueryObjectSort.SEQUENCE_NUMBER,
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
