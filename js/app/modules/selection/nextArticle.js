/* exported NextArticle */

// Copyright 2017 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;

const Module = imports.app.interfaces.module;
const HistoryStore = imports.app.historyStore;
const ReadingHistoryModel = imports.app.readingHistoryModel;
const Xapian = imports.app.modules.selection.xapian;
const Pages = imports.app.pages;

/**
 * Class: NextArticle
 * Retrieves the next article in the current context
 */
const NextArticle = new Module.Class({
    Name: 'Selection.NextArticle',
    Extends: Xapian.Xapian,

    _init: function (props={}) {
        this.parent(props);
        this._set_needs_refresh(true);
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;

        let item = HistoryStore.get_default().get_current_item();
        if (!item.model || item.page_type !== Pages.ARTICLE)
            return null;

        // NOTE that this
        let index = item.context.map(m => m.ekn_id).indexOf(item.model.ekn_id);

        let next_model;
        if (index < item.context.length - 1)
            next_model = item.context[index + 1];
        if (!next_model)
            return null;

        let query_object_params = {
            limit: 1,
            ids: [next_model.ekn_id],
            tags_match_all: ['EknArticleObject'],
        };

        return Eknc.QueryObject.new_from_props(query_object_params);
    },
});
