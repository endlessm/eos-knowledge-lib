/* exported Next */

// Copyright 2017 Endless Mobile, Inc.

const {DModel} = imports.gi;

const Module = imports.app.interfaces.module;
const HistoryStore = imports.app.historyStore;
const ReadingHistoryModel = imports.app.readingHistoryModel;
const Xapian = imports.app.modules.selection.xapian;
const Pages = imports.app.pages;

/**
 * Class: Next
 * Retrieves the next item in the current context
 */
var Next = new Module.Class({
    Name: 'Selection.Next',
    Extends: Xapian.Xapian,

    _init: function (props={}) {
        this.parent(props);
        this._set_needs_refresh(true);
    },

    provides_context: function () {
        return false;
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;

        let item = HistoryStore.get_default().get_current_item();
        if (!item.model || item.page_type !== Pages.ARTICLE)
            return null;

        // not necessarily the same object model instance
        let index = item.context.map(({id}) => id).indexOf(item.model.id);

        let next_model;
        if (index < item.context.length - 1)
            next_model = item.context[index + 1];
        if (!next_model)
            return null;

        return new DModel.Query({
            limit: 1,
            ids: [next_model.id],
        });
    },
});
