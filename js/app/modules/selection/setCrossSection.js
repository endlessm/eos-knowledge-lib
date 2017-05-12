/* exported SetCrossSection */

// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const Xapian = imports.app.modules.selection.xapian;

const SetCrossSection = new Module.Class({
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
        return Eknc.QueryObject.new_from_props({
            limit: limit,
            tags_match_all: tags,
            sort: Eknc.QueryObjectSort.SEQUENCE_NUMBER,
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
