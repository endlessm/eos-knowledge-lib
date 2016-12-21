/* exported Search */

// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;

const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const Xapian = imports.app.modules.selection.xapian;

const Search = new Module.Class({
    Name: 'Selection.Search',
    Extends: Xapian.Xapian,

    _init: function (props={}) {
        this.parent(props);
        HistoryStore.get_default().connect('notify::current-query', () => {
            this._set_needs_refresh(true);
        });
    },

    construct_query_object: function (limit, query_index) {
        let query = HistoryStore.get_default().current_query;
        if (query_index > 0 || query.length === 0)
            return null;
        return Eknc.QueryObject.new_from_props({
            query: query,
            limit: limit,
            tags_match_all: ['EknArticleObject'],
        });
    },
});
