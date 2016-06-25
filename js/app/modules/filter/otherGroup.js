// Copyright 2016 Endless Mobile, Inc.

/* exported OtherGroup */

const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;

const OtherGroup = new Module.Class({
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
                this._other_model_ids = this._other_model_ids.concat(selection.get_models().map((model) => model.ekn_id));
                this.emit('filter-changed');
            });
        });
    },

    // Filter implementation
    include_impl: function (model) {
        if (this._other_model_ids.length > 0) {
            return this._other_model_ids.indexOf(model.ekn_id) < 0;
        }
        return true;
    },
});
