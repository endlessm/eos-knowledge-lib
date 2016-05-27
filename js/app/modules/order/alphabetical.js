// Copyright 2016 Endless Mobile, Inc.

/* exported Alphabetical */

const GObject = imports.gi.GObject;

const Module = imports.app.interfaces.module;
const Order = imports.app.interfaces.order;

/**
 * Class: Alphabetical
 * Order that sorts cards alphabetically by title
 */
const Alphabetical = new Module.Class({
    Name: 'Order.Alphabetical',
    Extends: GObject.Object,
    Implements: [Order.Order],

    compare_impl: function (left, right) {
        return left.title.localeCompare(right.title);
    },
});
