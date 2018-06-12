/* exported Search */

// Copyright 2016 Endless Mobile, Inc.

const {DModel} = imports.gi;

const HistoryStore = imports.framework.historyStore;
const Module = imports.framework.interfaces.module;
const Xapian = imports.framework.modules.selection.xapian;

var Search = new Module.Class({
    Name: 'Selection.Search',
    Extends: Xapian.Xapian,

    _init: function (props={}) {
        this.parent(props);
        HistoryStore.get_default().connect('notify::current-search-terms', () => {
            this._set_needs_refresh(true);
        });
    },

    construct_query_object: function (limit, query_index) {
        let search_terms = HistoryStore.get_default().current_search_terms;
        if (query_index > 0 || search_terms.length === 0)
            return null;
        return new DModel.Query({search_terms, limit});
    },
});
