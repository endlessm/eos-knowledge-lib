/* exported ArticleContext */

// Copyright 2016 Endless Mobile, Inc.

const {DModel} = imports.gi;

const Module = imports.app.interfaces.module;
const HistoryStore = imports.app.historyStore;
const Pages = imports.app.pages;
const Xapian = imports.app.modules.selection.xapian;

var ArticleContext = new Module.Class({
    Name: 'Selection.ArticleContext',
    Extends: Xapian.Xapian,

    _init: function (props={}) {
        this.parent(props);
        this._item = null;
        this._update_item();

        HistoryStore.get_default().connect('changed', this._update_item.bind(this));
    },

    _update_item: function () {
        let item = HistoryStore.get_default().search_backwards(0, (item) => {
            return item.page_type === Pages.SET || item.search_terms.length > 0;
        });
        if (item === this._item)
            return;
        this._item = item;
        this._set_needs_refresh(true);
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;

        if (this._item === null)
            return null;

        if (this._item.search_terms.length > 0) {
            return new DModel.Query({
                limit: limit,
                search_terms: this._item.search_terms,
                tags_match_any: ['EknArticleObject'],
            });
        }

        return new DModel.Query({
            limit: limit,
            tags_match_any: this._item.model.child_tags,
        });
    },
});
