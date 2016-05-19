/* exported AllSets */

const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const Xapian = imports.app.modules.collection.xapian;

const AllSets = new Module.Class({
    Name: 'ExampleCollection',
    Extends: Xapian.Xapian,

    construct_query_object: function (limit) {
        return new QueryObject.QueryObject({
            tags: ['EknSetObject'],
            limit: limit,
        });
    },
});
