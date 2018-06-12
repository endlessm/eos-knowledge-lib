/* exported SetCrossSection */

// Copyright 2016 Endless Mobile, Inc.

const {DModel} = imports.gi;

const Actions = imports.framework.actions;
const Dispatcher = imports.framework.dispatcher;
const HistoryStore = imports.framework.historyStore;
const Module = imports.framework.interfaces.module;
const Xapian = imports.framework.modules.selection.xapian;

var SetCrossSection = new Module.Class({
    Name: 'Selection.SetCrossSection',
    Extends: Xapian.Xapian,

    _init: function (props={}) {
        this.parent(props);
        this._set_needs_refresh(true);
        HistoryStore.get_default().connect('notify::current-set', () => {
            this._set_needs_refresh(true);
        });
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;
        let tags = this.model.child_tags;
        let current_set = HistoryStore.get_default().current_set;
        if (current_set)
            tags = tags.concat(current_set.child_tags);
        return new DModel.Query({
            limit: limit,
            tags_match_all: tags,
        });
    },

    show_more: function () {
        Dispatcher.get_default().dispatch({
            action_type: Actions.ITEM_CLICKED,
            model: this.model,
            context_label: this.model.title,
        });
    },
});
