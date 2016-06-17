/* exported ArticlesForSet */

// Copyright 2016 Endless Mobile, Inc.

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const Xapian = imports.app.modules.selection.xapian;

const ArticlesForSet = new Module.Class({
    Name: 'ArticlesForSetSelection',
    Extends: Xapian.Xapian,

    _init: function (props) {
        this.parent(props);

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
        if (query_index > 0)
            return null;
        // FIXME: Once T12114 lands, we should modify this query to ensure
        // that this is getting only Articles, not Sets
        return new QueryObject.QueryObject({
            limit: limit,
            tags: this.model ? this.model.child_tags : [], // FIXME: Will go away when we have centralized state
            sort: QueryObject.QueryObjectSort.SEQUENCE_NUMBER,
        });
    },

    show_more: function () {
        Dispatcher.get_default().dispatch({
            action_type: Actions.SET_CLICKED,
            model: this.model,
            context_label: this.model.title,
        });
    },
});
