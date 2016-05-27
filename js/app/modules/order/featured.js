// Copyright 2016 Endless Mobile, Inc.

/* exported Featured */

const GObject = imports.gi.GObject;

const Module = imports.app.interfaces.module;
const Order = imports.app.interfaces.order;

/**
 * Class: Featured
 * Order that sorts cards by placing featured before non-featured
 */
const Featured = new Module.Class({
    Name: 'Order.Featured',
    Extends: GObject.Object,
    Implements: [Order.Order],

    compare_impl: function (left, right) {
        if (left.featured === right.featured)
            return 0;
        if (left.featured)
            return -1;
        return 1;
    },
});
