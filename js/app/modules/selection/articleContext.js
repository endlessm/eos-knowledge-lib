/* exported ArticlesForSet */

// Copyright 2016 Endless Mobile, Inc.

const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const Pages = imports.app.pages;
const QueryObject = imports.search.queryObject;
const Xapian = imports.app.modules.selection.xapian;

const ArticleContext = new Module.Class({
    Name: 'Selection.ArticleContext',
    Extends: Xapian.Xapian,

    _init: function (props) {
        this.parent(props);
        /* We are not connecting to the HistoryStore changed signal here
         * because the clearing of content is handled by the content group
         * when it gets made ready. If we get rid of the make_ready API,
         * then remember to add a listener to HistoryStore changed signal
         * here. */
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;

        let item = HistoryStore.get_default().search_backwards(0, (item) =>
            !!item.query || item.page_type === Pages.SET
        );

        if (!item)
            throw Error("This selection can only work if there is a set page or query in the history");

        if (item.query) {
            return new QueryObject.QueryObject({
                limit: limit,
                query: item.query,
                tags_match_all: ['EknArticleObject'],
            });
        } else if (item.page_type === Pages.SET) {
            return new QueryObject.QueryObject({
                limit: limit,
                tags_match_all: ['EknArticleObject'],
                tags_match_any: item.model.child_tags,
            });
        } else {
            return null;
        }
    },
});
