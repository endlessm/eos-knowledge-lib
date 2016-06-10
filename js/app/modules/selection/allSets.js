/* exported AllSets */

// Copyright 2016 Endless Mobile, Inc.

const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const Xapian = imports.app.modules.selection.xapian;

const AllSets = new Module.Class({
    Name: 'AllSetsSelection',
    Extends: Xapian.Xapian,

    _init: function (props) {
        this.parent(props);
    },

    construct_query_object: function (limit) {
        return new QueryObject.QueryObject({
            limit: limit,
            tags: ['EknSetObject'],
        });
    },
});
