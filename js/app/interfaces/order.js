// Copyright 2016 Endless Mobile, Inc.

/* exported Order */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Interface: Order
 * Module that sorts card models
 *
 * A module implementing this interface can be added to the "order" slot of an
 * <Arrangement>.
 * It tells the arrangement in which order to display its cards, based on
 * data from each card's <ContentObjectModel>.
 *
 * To write an <Order> implementation, implement the <compare_impl()> method.
 *
 * Requires:
 *   <Module>
 */
const Order = new Lang.Interface({
    Name: 'Order',
    Requires: [ Module.Module ],

    Properties: {
        /**
         * Property: ascending
         * Whether to sort in ascending (true) or descending (false) order
         *
         * Default value:
         *   true
         */
        'ascending': GObject.ParamSpec.boolean('ascending', 'Ascending',
            'Sort in ascending order rather than descending',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            true),
    },

    Slots: {
        'sub-order': {},
    },

    _interface_init: function () {
        this._sub_order = this.create_submodule('sub-order');
    },

    /**
     * Method: compare
     * Determine the sort order of two models
     *
     * Parameters:
     *   left - a <ContentObjectModel>
     *   right - a <ContentObjectModel>
     *
     * Returns:
     *   A value less than 0 if @left should sort before @right.
     *   Zero if @left and @right should sort equally.
     *   A value greater than 0 if @right should sort before @left.
     */
    compare: function (left, right) {
        let result = this.compare_impl(left, right);
        if (result === 0 && this._sub_order)
            result = this._sub_order.compare(left, right);
        return (this.ascending ? 1 : -1) * result;
    },

    /**
     * Method: compare_impl
     * Intended to be implemented
     *
     * Same signature and return value as <compare()>.
     * Don't call this method directly, instead write it in your implementation.
     */
    compare_impl: Lang.Interface.UNIMPLEMENTED,
});
