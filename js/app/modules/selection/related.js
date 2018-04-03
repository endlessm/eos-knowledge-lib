/* exported Related */

// Copyright 2017 Endless Mobile, Inc.

const {DModel} = imports.gi;

const Module = imports.app.interfaces.module;
const HistoryStore = imports.app.historyStore;
const ReadingHistoryModel = imports.app.readingHistoryModel;
const Xapian = imports.app.modules.selection.xapian;
const Pages = imports.app.pages;

/**
 * Class: Related
 * Retrieves content related to the current article
 *
 * Retrieves content that is related to the article that is
 * currently being displayed on the article page.
 */
var Related = new Module.Class({
    Name: 'Selection.Related',
    Extends: Xapian.Xapian,

    _init: function (props={}) {
        this.parent(props);
        this._set_needs_refresh(true);
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;

        let item = HistoryStore.get_default().get_current_item();
        if (!item.model || item.page_type !== Pages.ARTICLE)
            return null;

        let tags = item.model.tags.filter(tag => !tag.startsWith('Ekn'));

        return new DModel.Query({
            limit: limit,
            tags_match_any: tags,
        });
    },
});
