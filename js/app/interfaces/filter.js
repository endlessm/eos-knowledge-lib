// Copyright 2016 Endless Mobile, Inc.

/* exported Filter */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Interface: Filter
 * Module that selects which card models to show
 *
 * A module implementing this interface can be added to the "filter" slot of an
 * <Arrangement>.
 * It tells the arrangement which cards to display and which to hide, based on
 * data from each card's <ContentObjectModel>.
 *
 * Filters are always applied after <Orders> are.
 *
 * To write a <Filter> implementation, implement the <include_impl()> method.
 * The <include()> method will take care of applying the <invert> property.
 *
 * Requires:
 *   <Module>
 */
var Filter = new Lang.Interface({
    Name: 'Filter',
    Requires: [ Module.Module ],

    Properties: {
        /**
         * Property: invert
         * Whether to invert the filter
         *
         * Default value:
         *   false
         */
        'invert': GObject.ParamSpec.boolean('invert', 'Invert',
            'Whether to invert the filter',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    // Emitted when the filter gains new information that influences its filtering process.
    // The selection owning this filter should refilter its models at this point.
    Signals: {
        'filter-changed': {},
    },

    Slots: {
        'sub-filter': {},
    },

    _interface_init: function () {
        this._sub_filter = this.create_submodule('sub-filter');
    },

    /**
     * Method: include
     * Determine whether an arrangement should show a model as a card
     *
     * Parameters:
     *   model - a <ContentObjectModel>
     *
     * Returns:
     *   True if @model should be included, false if it should not.
     */
    include: function (model) {
        let retval = this.include_impl(model);
        let to_include = this.invert ? !retval : retval;
        if (to_include && this._sub_filter)
            return this._sub_filter.include(model);
        return to_include;
    },

    /**
     * Method: include_impl
     * Intended to be implemented
     *
     * Signature and return type same as <include()>.
     * Don't call this method directly, instead write it in your implementation.
     */
    include_impl: Lang.Interface.UNIMPLEMENTED,


    /**
     * Method: modify_xapian_query
     * Make any necessary modifications to the Xapian query
     *
     * If using a <Filter> with a <Selection.Xapian> subclass, you don't
     * necessarily want to do filtering only after querying the Xapian database.
     * Since database queries are carried out in batches, you want to specify
     * your filtering criteria at query time.
     * This method will make the necessary modifications to a passed-in query
     * object.
     *
     * Don't override this method in your implementation; instead, implement
     * <Filter.modify_xapian_query_impl>.
     *
     * Parameters:
     *   query - an <EosKnowledgeContent.QueryObject>
     *
     * Returns:
     *   a new <EosKnowledgeContent.QueryObject>, may be the same object
     */
    modify_xapian_query: function (query) {
        let modified_query = query;
        if (this.modify_xapian_query_impl)
            modified_query = this.modify_xapian_query_impl(query);
        if (this._sub_filter)
            return this._sub_filter.modify_xapian_query(modified_query);
        return modified_query;
    },

    /**
     * Method: can_modify_xapian_query
     * Whether the filter can modify a Xapian query
     *
     * Returns:
     *   true if <Filter.modify_xapian_query_impl> is implemented
     */
    can_modify_xapian_query: function () {
        return !!this.modify_xapian_query_impl;
    },

    /**
     * Method: modify_xapian_query_impl
     * Intended to be implemented
     *
     * Makes modifications to a query object for this <Filter> only.
     * <Filter.modify_xapian_query> takes care of merging together modifications
     * from sub-orders.
     *
     * Implementing this method is optional.
     *
     * This method might not be called at all if the <Filter> is used with a
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
