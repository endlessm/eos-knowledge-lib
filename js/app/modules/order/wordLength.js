// Copyright 2016 Endless Mobile, Inc.

/* exported WordLength */

const GObject = imports.gi.GObject;

const Module = imports.app.interfaces.module;
const Order = imports.app.interfaces.order;

/**
 * Class: WordLength
 * Order that sorts object models by word length
 */
const WordLength = new Module.Class({
    Name: 'WordLengthOrder',
    Extends: GObject.Object,
    Implements: [Order.Order],

    compare_impl: function (left, right) {
        return left.title.length - right.title.length;
    },
});
