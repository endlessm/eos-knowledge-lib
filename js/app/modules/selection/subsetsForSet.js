/* exported SubsetsForSet */

// Copyright 2016 Endless Mobile, Inc.

const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const SetObjectModel = imports.search.setObjectModel;
const Xapian = imports.app.modules.selection.xapian;

const SubsetsForSet = new Module.Class({
    Name: 'Selection.SubsetsForSet',
    Extends: Xapian.Xapian,

    // Selection.Xapian implementation
    on_history_changed: function (history) {
        if (!this.global)
            return;
        let item = history.get_current_item();
        if (item.model instanceof SetObjectModel.SetObjectModel &&
            item.model !== this.model) {
            this.model = item.model;
            this._set_needs_refresh(true);
        }
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;

        return new QueryObject.QueryObject({
            limit: limit,
            tags_match_any: this.model.child_tags,
            tags_match_all: ['EknSetObject'],
            sort: QueryObject.QueryObjectSort.SEQUENCE_NUMBER,
        });
    },
});
