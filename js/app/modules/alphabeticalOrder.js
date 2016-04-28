// Copyright (C) 2016 Endless Mobile, Inc.

/* exported AlphabeticalOrder */

const GObject = imports.gi.GObject;

const Module = imports.app.interfaces.module;
const Order = imports.app.interfaces.order;

/**
 * Class: AlphabeticalOrder
 * Order that sorts cards alphabetically by title
 */
const AlphabeticalOrder = new Module.Class({
    Name: 'AlphabeticalOrder',
    Extends: GObject.Object,
    Implements: [Order.Order],

    compare_impl: function (left, right) {
        return left.title.localeCompare(right.title);
    },
});
