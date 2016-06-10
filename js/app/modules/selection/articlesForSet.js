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
                        this.queue_load_more();
                    }
                    break;
            }
        });
    },

    construct_query_object: function (limit) {
        // This should only be getting Articles, not Sets
        return new QueryObject.QueryObject({
            limit: limit,
            tags: this.model.child_tags,
        });
    },
});
