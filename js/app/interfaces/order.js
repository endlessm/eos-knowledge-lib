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
var Order = new Lang.Interface({
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

    /**
     * Method: modify_xapian_query
     * Make any necessary modifications to the Xapian query
     *
     * If using an <Order> with a <Selection.Xapian> subclass, you don't
     * necessarily want to do sorting only after querying the Xapian database.
     * Since database queries are carried out in batches, you want to specify
     * your sorting criteria at query time.
     * This method will make the necessary modifications to a passed-in query
     * object.
     *
     * Don't override this method in your implementation; instead, implement
     * <Order.modify_xapian_query_impl>.
     *
     * Parameters:
     *   query - an <EosKnowledgeContent.QueryObject>
     *
     * Returns:
     *   a new <EosKnowledgeContent.QueryObject>, may be the same object
     */
    modify_xapian_query: function (query) {
        // You can't sort by two things over xapian-bridge. In practice, we
        // don't expect that case to occur.
        if (!this.modify_xapian_query_impl) {
            if (this._sub_order)
                return this._sub_order.modify_xapian_query(query);
            return query;
        }
        return this.modify_xapian_query_impl(query);
    },

    /**
     * Method: can_modify_xapian_query
     * Whether the order can modify a Xapian query
     *
     * Returns:
     *   true if <Order.modify_xapian_query_impl> is implemented
     */
    can_modify_xapian_query: function () {
        return !!this.modify_xapian_query_impl;
    },

    /**
     * Method: modify_xapian_query_impl
     * Intended to be implemented
     *
     * Makes modifications to a query object for this <Order> only.
     * <Order.modify_xapian_query> takes care of merging together modifications
     * from sub-orders.
     *
     * Implementing this method is optional.
     *
     * This method might not be called at all if the <Order> is used with a
     * non-Xapian <Selection>.
     * Your implementation must work correctly even if it is never called.
     *
     * Parameters:
     *   query - an <EosKnowledgeContent.QueryObject>
     *
     * Returns:
     *   a new <EosKnowledgeContent.QueryObject>, may be the same object
     */
    modify_xapian_query_impl: null,
});
