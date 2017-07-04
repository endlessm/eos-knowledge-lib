// Copyright 2016 Endless Mobile, Inc.

/* exported Alphabetical */

const GObject = imports.gi.GObject;

const Module = imports.app.interfaces.module;
const Order = imports.app.interfaces.order;

/**
 * Class: Alphabetical
 * Order that sorts cards alphabetically by title
 */
var Alphabetical = new Module.Class({
    Name: 'Order.Alphabetical',
    Extends: GObject.Object,
    Implements: [Order.Order],

    Properties: {
        'case-sensitive': GObject.ParamSpec.boolean('case-sensitive', 'Case sensitive',
            'Whether the sorting should be case sensitive',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, false),
    },

    compare_impl: function (left, right) {
        let a = left.title;
        let b = right.title;

        // We always want uppercase letters to come after lowercase ones
        // which won't happen if we just leave it to localeCompare
        let first_char_a = a.charAt(0);
        let first_char_b = b.charAt(0);
        let is_upper_a = first_char_a == first_char_a.toLocaleUpperCase();
        let is_upper_b = first_char_b == first_char_b.toLocaleUpperCase();

        if (is_upper_a !== is_upper_b && this.case_sensitive)
            return a > b ? -1 : 1;
        return a.localeCompare(b);
    },
});
