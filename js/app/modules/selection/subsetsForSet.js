/* exported SubsetsForSet */

// Copyright 2016 Endless Mobile, Inc.

const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const Xapian = imports.app.modules.selection.xapian;

const SubsetsForSet = new Module.Class({
    Name: 'Selection.SubsetsForSet',
    Extends: Xapian.Xapian,

    _init: function (props={}) {
        this.parent(props);
        if (this.global) {
            this.model = HistoryStore.get_default().current_set;
            HistoryStore.get_default().connect('notify::current-set', () => {
                this.model = HistoryStore.get_default().current_set;
                this._set_needs_refresh(true);
            });
        }
        this._set_needs_refresh(true);
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;

        if (!this.model)
            return null;

        return new QueryObject.QueryObject({
            limit: limit,
            tags_match_any: this.model.child_tags,
            tags_match_all: ['EknSetObject'],
            sort: QueryObject.QueryObjectSort.SEQUENCE_NUMBER,
        });
    },
});
