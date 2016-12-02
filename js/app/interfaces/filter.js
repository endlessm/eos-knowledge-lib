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
const Filter = new Lang.Interface({
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
});
