// Copyright 2016 Endless Mobile, Inc.

/* exported Thematic */

const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;

/**
 * Class: Filter.Thematic
 *
 * If the current item in our history model is featured, filter for non-featured
 * models. If the current item in our history is not featured, filter for
 * featured models.
 */
const Thematic = new Module.Class({
    Name: 'Filter.Thematic',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    _init: function (props={}) {
        this.parent(props);
        HistoryStore.get_default().connect('changed', () => {
            this.emit('filter-changed');
        });
    },

    // Filter implementation
    include_impl: function (model) {
        return (model.featured != HistoryStore.get_default().get_current_item().model.featured);
    },
});
