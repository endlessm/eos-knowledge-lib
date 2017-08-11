// Copyright 2016 Endless Mobile, Inc.

/* exported CurrentSet */

const Eknc = imports.gi.EosKnowledgeContent;
const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const SetMap = imports.app.setMap;
const Utils = imports.app.utils;

var CurrentSet = new Module.Class({
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

    // Filter override
    // This Filter can modify the Xapian query, but it can't express its whole
    // filtering logic in the Xapian query, so we still need to request more
    // models in case some returned models must be dropped.
    can_modify_xapian_query: function () {
        return false;
    },

    // Filter implementation
    modify_xapian_query_impl: function (query) {
        if (this.invert) {
            return Eknc.QueryObject.new_from_object(query, {
                excluded_tags: Utils.union(query.excluded_tags,
                    this._current_set.child_tags),
            });
        }
        return Eknc.QueryObject.new_from_object(query, {
            tags_match_any: Utils.union(query.tags_match_any,
                this._current_set.child_tags)
        });
    },
});
