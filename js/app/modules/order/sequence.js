// Copyright 2018 Endless Mobile, Inc.

/* exported Sequence */

const Eknc = imports.gi.EosKnowledgeContent;
const GObject = imports.gi.GObject;

const Module = imports.app.interfaces.module;
const Order = imports.app.interfaces.order;

/**
 * Class: Sequence
 * Order that sorts object models by sequence number
 */
var Sequence = new Module.Class({
    Name: 'Order.Sequence',
    Extends: GObject.Object,
    Implements: [Order.Order],

    compare_impl(left, right) {
        return left.sequence_number - right.sequence_number;
    },

    modify_xapian_query_impl(query) {
        return Eknc.QueryObject.new_from_object(query, {
            order: Eknc.QueryObjectOrder[this.ascending? 'ASCENDING' : 'DESCENDING'],
            sort: Eknc.QueryObjectSort.SEQUENCE_NUMBER,
        });
    },
});
