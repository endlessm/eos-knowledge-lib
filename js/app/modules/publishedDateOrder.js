// Copyright 2016 Endless Mobile, Inc.

/* exported PublishedDateOrder */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const Order = imports.app.interfaces.order;

/**
 * Class: PublishedDateOrder
 * Order that sorts object models by publication date
 */
const PublishedDateOrder = new Lang.Class({
    Name: 'PublishedDateOrder',
    Extends: GObject.Object,
    Implements: [Module.Module, Order.Order],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'ascending': GObject.ParamSpec.override('ascending', Order.Order),
    },

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
