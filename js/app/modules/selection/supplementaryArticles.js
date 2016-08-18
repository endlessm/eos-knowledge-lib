/* exported SupplementaryArticles */

// Copyright 2016 Endless Mobile, Inc.

const Module = imports.app.interfaces.module;
const HistoryStore = imports.app.historyStore;
const QueryObject = imports.search.queryObject;
const ReadingHistoryModel = imports.app.readingHistoryModel;
const Xapian = imports.app.modules.selection.xapian;

const SupplementaryArticles = new Module.Class({
    Name: 'Selection.SupplementaryArticles',
    Extends: Xapian.Xapian,

    _init: function (props={}) {
        this.parent(props);
        HistoryStore.get_default().connect('notify::current-set', () => {
            this._set_needs_refresh(true);
        });
    },

    construct_query_object: function (limit, query_index) {
        let set = HistoryStore.get_default().current_set;
        let tags = set ? set.child_tags : [];
        let query_object_params = {
            limit: limit,
            tags_match_all: ['EknArticleObject'],
            excluded_tags: tags,
            sort: QueryObject.QueryObjectSort.SEQUENCE_NUMBER,
        };
        switch (query_index) {
            case 0:
                query_object_params.excluded_ids = [...ReadingHistoryModel.get_default().get_read_articles()];
                break;
            case 1:
                break;
            default:
                return null;
        }
        return new QueryObject.QueryObject(query_object_params);
    },
});
