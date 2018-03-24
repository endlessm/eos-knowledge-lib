// Copyright 2016 Endless Mobile, Inc.

/* exported PublishedDate */

const {DModel, GObject} = imports.gi;

const Module = imports.app.interfaces.module;
const Order = imports.app.interfaces.order;

/**
 * Class: PublishedDate
 * Order that sorts object models by publication date
 */
var PublishedDate = new Module.Class({
    Name: 'Order.PublishedDate',
    Extends: GObject.Object,
    Implements: [Order.Order],

    compare_impl: function (left, right) {
        if (!left.published && !right.published)
            return 0;
        if (!left.published)
            return -1;
        if (!right.published)
            return 1;
        return left.published.localeCompare(right.published);
    },

    modify_xapian_query_impl: function (query) {
        return DModel.Query.new_from_object(query, {
            order: DModel.QueryOrder[this.ascending? 'ASCENDING' : 'DESCENDING'],
            sort: DModel.QuerySort.DATE,
        });
    },
});
