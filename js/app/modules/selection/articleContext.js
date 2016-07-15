/* exported ArticlesForSet */

// Copyright 2016 Endless Mobile, Inc.

const Module = imports.app.interfaces.module;
const Pages = imports.app.pages;
const QueryObject = imports.search.queryObject;
const Xapian = imports.app.modules.selection.xapian;

const ArticleContext = new Module.Class({
    Name: 'Selection.ArticleContext',
    Extends: Xapian.Xapian,

    _init: function (props={}) {
        this.parent(props);
        this._item = {};
    },

    // Selection.Xapian implementation
    on_history_changed: function (history) {
        let item = history.get_current_item();
        if (!item)
            return;

        if ((item.query && item.query !== this._item.query) ||
            (item.page_type === Pages.SET && this._item.model != item.model)) {
            this._item = item;
            this._set_needs_refresh(true);
        }
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;

        if (this._item.query) {
            return new QueryObject.QueryObject({
                limit: limit,
                query: this._item.query,
                tags_match_all: ['EknArticleObject'],
            });
        } else if (this._item.page_type === Pages.SET) {
            return new QueryObject.QueryObject({
                limit: limit,
                tags_match_all: ['EknArticleObject'],
                tags_match_any: this._item.model.child_tags,
            });
        } else {
            return null;
        }
        return null;
    },
});
