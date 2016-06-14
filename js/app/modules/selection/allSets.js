/* exported AllSets */

// Copyright 2016 Endless Mobile, Inc.

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const Xapian = imports.app.modules.selection.xapian;

const AllSets = new Module.Class({
    Name: 'AllSetsSelection',
    Extends: Xapian.Xapian,

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;
        return new QueryObject.QueryObject({
            limit: limit,
            tags: ['EknSetObject'],
        });
    },

    show_more: function () {
        Dispatcher.get_default().dispatch({
            action_type: Actions.ALL_SETS_CLICKED,
        });
    },
});
