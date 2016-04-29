/* exported ExampleCollection */

const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const Xapian = imports.app.modules.collection.xapian;

// This collection returns every article that starts with "D"
const Example = new Module.Class({
    Name: 'ExampleCollection',
    Extends: Xapian.Xapian,

    construct_query_object: function (limit) {
        return new QueryObject.QueryObject({
            literal_query: 'exact_title:d*',
            tags: ['EknArticleObject'],
            limit: limit,
        });
    },
});
