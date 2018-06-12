/* exported AllSets */

// Copyright 2016 Endless Mobile, Inc.

const {DModel} = imports.gi;

const Actions = imports.framework.actions;
const Dispatcher = imports.framework.dispatcher;
const Module = imports.framework.interfaces.module;
const Xapian = imports.framework.modules.selection.xapian;

var AllSets = new Module.Class({
    Name: 'Selection.AllSets',
    Extends: Xapian.Xapian,

    _init: function (props={}) {
        this.parent(props);
        this._set_needs_refresh(true);
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;
        return new DModel.Query({
            limit: limit,
            tags_match_all: ['EknSetObject'],
        });
    },

    // FIXME: This is the only thing preventing this Selection from being
    // refactored into Selection.All + Filter.Sets
    show_more: function () {
        Dispatcher.get_default().dispatch({
            action_type: Actions.ALL_SETS_CLICKED,
        });
    },
});
