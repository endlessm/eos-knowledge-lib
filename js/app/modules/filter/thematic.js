// Copyright 2016 Endless Mobile, Inc.

/* exported Thematic */

const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;

/**
 * Class: Thematic
 *
 * If the current item in our history model is featured, filter for non-featured
 * models. If the current item in our history is not featured, filter for
 * featured models.
 */
var Thematic = new Module.Class({
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
        let item = HistoryStore.get_default().get_current_item();
        // Kind of silly but without this check the filter throws on app startup
        // because Selection.AllSets always loads its content right away on
        // init. It will get refiltered properly once a user clicks on a set
        // object.
        if (item && item.model)
            return (model.featured != item.model.featured);
        return true;
    },
});
