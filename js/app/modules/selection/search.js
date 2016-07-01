/* exported Search */

// Copyright 2016 Endless Mobile, Inc.

const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const Xapian = imports.app.modules.selection.xapian;

const Search = new Module.Class({
    Name: 'SearchSelection',
    Extends: Xapian.Xapian,

    _init: function (props) {
        this.parent(props);
        let store = HistoryStore.get_default();
        store.connect('changed', this._on_history_changed.bind(this));
    },

    _on_history_changed: function () {
        this.clear();
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;
        let item = HistoryStore.get_default().get_current_item();
        if (!item)
            throw new Error('This selection only works when there are search terms');
        return new QueryObject.QueryObject({
            query: item.query,
            limit: limit,
            tags_match_all: ['EknArticleObject'],
        });
    },
});
