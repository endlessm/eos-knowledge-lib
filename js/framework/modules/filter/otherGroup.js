// Copyright 2016 Endless Mobile, Inc.

/* exported OtherGroup */

const {DModel, GObject} = imports.gi;

const Filter = imports.framework.interfaces.filter;
const Module = imports.framework.interfaces.module;
const Utils = imports.framework.utils;

var OtherGroup = new Module.Class({
    Name: 'Filter.OtherGroup',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    References: {
        'other': {},
    },

    _init: function (props) {
        this.parent(props);
        this._other_model_ids = new Set();
        this.reference_module('other', (module) => {
            module.connect('models-changed', (selection) => {
                selection.get_models().forEach(({id}) => this._other_model_ids.add(id));
                this.emit('filter-changed');
            });
        });
    },

    // Filter implementation
    include_impl: function (model) {
        return !this._other_model_ids.has(model.id);
    },

    // Filter implementation
    modify_xapian_query_impl: function (query) {
        if (this.invert) {
            let ids = [...this._other_model_ids];
            if (query.ids.length)
                ids = Utils.intersection(query.ids, ids);
            return DModel.Query.new_from_object(query, {ids});
        }
        return DModel.Query.new_from_object(query, {
            excluded_ids: Utils.union(query.excluded_ids, this._other_model_ids),
        });
    },
});
