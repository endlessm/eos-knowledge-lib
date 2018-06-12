// Copyright 2018 Endless Mobile, Inc.

/* exported Sequence */

const {DModel, GObject} = imports.gi;

const Module = imports.framework.interfaces.module;
const Order = imports.framework.interfaces.order;

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
        return DModel.Query.new_from_object(query, {
            order: DModel.QueryOrder[this.ascending? 'ASCENDING' : 'DESCENDING'],
            sort: DModel.QuerySort.SEQUENCE_NUMBER,
        });
    },
});
