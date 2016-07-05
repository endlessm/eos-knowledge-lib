/* exported SupplementaryArticles */

// Copyright 2016 Endless Mobile, Inc.

const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const ReadingHistoryModel = imports.app.readingHistoryModel;
const Xapian = imports.app.modules.selection.xapian;

const SupplementaryArticles = new Module.Class({
    Name: 'Selection.SupplementaryArticles',
    Extends: Xapian.Xapian,

    construct_query_object: function (limit, query_index) {
        let model = this.model;
        if (this.global) {
            let item = HistoryStore.get_default().get_current_item();
            model = item.model;
        }

        if (!model)
            throw new Error('You should not be loading this selection unless on the set page');

        let query_object_params = {
            limit: limit,
            tags_match_all: ['EknArticleObject'],
            excluded_tags: model.child_tags,
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
