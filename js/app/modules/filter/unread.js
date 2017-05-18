// Copyright 2016 Endless Mobile, Inc.

/* exported Unread */

const Eknc = imports.gi.EosKnowledgeContent;
const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;
const ReadingHistoryModel = imports.app.readingHistoryModel;
const Utils = imports.app.utils;

const Unread = new Module.Class({
    Name: 'Filter.Unread',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    // Filter implementation
    include_impl: function (model) {
        return !ReadingHistoryModel.get_default().is_read_article(model.ekn_id);
    },

    // Filter implementation
    modify_xapian_query_impl: function (query) {
        let id_set = ReadingHistoryModel.get_default().get_read_articles();
        if (this.invert) {
            let ids = [...id_set];
            if (query.ids.length)
                ids = Utils.intersection(query.ids, ids);
            return Eknc.QueryObject.new_from_object(query, { ids: ids });
        }
        return Eknc.QueryObject.new_from_object(query, {
            excluded_ids: Utils.union(query.excluded_ids, [...id_set]),
        });
    },
});
