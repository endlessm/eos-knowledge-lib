// Copyright 2016 Endless Mobile, Inc.

/* exported OtherGroup */

const {DModel, GObject} = imports.gi;

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

var OtherGroup = new Module.Class({
    Name: 'Filter.OtherGroup',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    References: {
        'other': {},
    },

    _init: function (props) {
        this.parent(props);
        this._other_model_ids = [];
        this.reference_module('other', (module) => {
            module.connect('models-changed', (selection) => {
                this._other_model_ids = this._other_model_ids.concat(selection.get_models().map(({id}) => id));
                this.emit('filter-changed');
            });
        });
    },

    // Filter implementation
    include_impl: function (model) {
        if (this._other_model_ids.length > 0) {
            return this._other_model_ids.indexOf(model.id) < 0;
        }
        return true;
    },

    // Filter implementation
    modify_xapian_query_impl: function (query) {
        if (this.invert) {
            let ids = this._other_model_ids;
            if (query.ids.length)
                ids = Utils.intersection(query.ids, ids);
            return DModel.Query.new_from_object(query, {ids});
        }
        return DModel.Query.new_from_object(query, {
            excluded_ids: Utils.union(query.excluded_ids, this._other_model_ids),
        });
    },
});
