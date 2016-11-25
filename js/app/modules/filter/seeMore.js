// Copyright 2016 Endless Mobile, Inc.

/* exported SeeMore */

const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;

const SeeMore = new Module.Class({
    Name: 'Filter.SeeMore',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    _init: function (props) {
        this.parent(props);
        this._current_set = null;

        HistoryStore.get_default().connect('notify::current-set', () => {
            this._current_set = HistoryStore.get_default().current_set;
            this.emit('filter-changed');
        });
    },

    // Filter implementation
    include_impl: function (model) {
        if (this._current_set)
            return model.ekn_id !== this._current_set.ekn_id;
        return true;
    },
});
