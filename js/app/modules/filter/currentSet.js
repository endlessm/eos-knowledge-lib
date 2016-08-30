// Copyright 2016 Endless Mobile, Inc.

/* exported CurrentSet */

const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const SetMap = imports.app.setMap;

const CurrentSet = new Module.Class({
    Name: 'Filter.CurrentSet',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    _init: function (props) {
        this.parent(props);
        this._current_set = null;

        HistoryStore.get_default().connect('changed', () => {
            let item = HistoryStore.get_default().get_current_item();
            if (!item || !item.model)
                return;

            this._current_set = item.model;
        });
    },

    // Filter implementation
    include_impl: function (model) {
        let belongs_to_set = false;
        let belongs_to_subset = false;

        model.tags.forEach((tag) => {
            let set = SetMap.get_set_for_tag(tag);
            if (!set)
                return;
            if (set.ekn_id === this._current_set.ekn_id)
                belongs_to_set = true;

            let parent_set = SetMap.get_parent_set(set);
            if (!parent_set)
                return;
            if (parent_set.ekn_id === this._current_set.ekn_id)
                belongs_to_subset = true;
        });

        return belongs_to_set && !belongs_to_subset;
    },
});
