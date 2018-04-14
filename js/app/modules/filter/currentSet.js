// Copyright 2016 Endless Mobile, Inc.

/* exported CurrentSet */

const {DModel, GObject} = imports.gi;

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
            if (set.id === this._current_set.id)
                belongs_to_set = true;

            let parent_set = SetMap.get_parent_set(set);
            if (!parent_set)
                return;
            if (parent_set.id === this._current_set.id)
                belongs_to_subset = true;
        });

        return belongs_to_set && !belongs_to_subset;
    },

    // Filter implementation
    modify_xapian_query_impl: function (query) {
        let tags = this._current_set.child_tags;
        let subtags = [];
        SetMap.get_children_sets(this._current_set).forEach(set => {
            subtags.push(...set.child_tags);
        });

        if (this.invert) {
            return DModel.Query.new_from_object(query, {
                tags_match_any: Utils.union(query.tags_match_any, subtags),
                excluded_tags: Utils.union(query.excluded_tags, tags),
            });
        }
        return DModel.Query.new_from_object(query, {
            tags_match_any: Utils.union(query.tags_match_any, tags),
            excluded_tags: Utils.union(query.excluded_tags, subtags),
        });
    },
});
