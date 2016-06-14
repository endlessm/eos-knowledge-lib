/* exported SupplementaryArticles */

// Copyright 2016 Endless Mobile, Inc.

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const ReadingHistoryModel = imports.app.readingHistoryModel;
const Xapian = imports.app.modules.selection.xapian;

const SupplementaryArticles = new Module.Class({
    Name: 'SupplementaryArticlesSelection',
    Extends: Xapian.Xapian,

    _init: function (props) {
        this.parent(props);

        // FIXME: Remove this when we have history store
        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.SHOW_SET:
                    if (this.global) {
                        this.model = payload.model;
                    }
                    break;
            }
        });
    },

    construct_query_object: function (limit, query_index) {
        let query_object = new QueryObject.QueryObject({
            limit: limit,
            tags: ['EknArticleObject'],
            excluded_tags: this.model ? this.model.child_tags : [],
            tag_match: QueryObject.QueryObjectTagMatch.ALL,
            sort: QueryObject.QueryObjectSort.SEQUENCE_NUMBER,
        });
        switch (query_index) {
            case 0:
                query_object.excluded_ids = [...ReadingHistoryModel.get_default().get_read_articles()];
                return query_object;
            case 1:
                return query_object;
            default:
                return null;
        }
    },
});
