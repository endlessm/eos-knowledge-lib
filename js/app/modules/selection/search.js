/* exported Search */

// Copyright 2016 Endless Mobile, Inc.

const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const Xapian = imports.app.modules.selection.xapian;

const Search = new Module.Class({
    Name: 'Selection.Search',
    Extends: Xapian.Xapian,

    // Selection.Xapian implementation
    on_history_changed: function (history) {
        let item = history.get_current_item();
        if (item.query) {
            this._item = item;
            this._set_needs_refresh(true);
        }
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;
        return new QueryObject.QueryObject({
            query: this._item.query,
            limit: limit,
            tags_match_all: ['EknArticleObject'],
        });
    },
});
