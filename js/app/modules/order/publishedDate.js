// Copyright 2016 Endless Mobile, Inc.

/* exported PublishedDate */

const GObject = imports.gi.GObject;

const Module = imports.app.interfaces.module;
const Order = imports.app.interfaces.order;

/**
 * Class: PublishedDate
 * Order that sorts object models by publication date
 */
const PublishedDate = new Module.Class({
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
});
