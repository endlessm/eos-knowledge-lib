// Copyright 2016 Endless Mobile, Inc.

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
    Implements: [Module.Module, Order.Order],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'ascending': GObject.ParamSpec.override('ascending', Order.Order),
    },

    compare_impl: function (left, right) {
        return left.title.localeCompare(right.title);
    },
});
