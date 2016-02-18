// Copyright 2016 Endless Mobile, Inc.

/* exported FeaturedOrder */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const Order = imports.app.interfaces.order;

/**
 * Class: FeaturedOrder
 * Order that sorts cards by placing featured before non-featured
 */
const FeaturedOrder = new Lang.Class({
    Name: 'FeaturedOrder',
    Extends: GObject.Object,
    Implements: [Module.Module, Order.Order],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'ascending': GObject.ParamSpec.override('ascending', Order.Order),
    },

    compare_impl: function (left, right) {
        if (left.featured === right.featured)
            return 0;
        if (left.featured)
            return -1;
        return 1;
    },
});
