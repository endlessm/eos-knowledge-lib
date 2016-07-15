/* exported AllHighlights */

// Copyright 2016 Endless Mobile, Inc.

const GLib = imports.gi.GLib;

const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const Xapian = imports.app.modules.selection.xapian;

const AllHighlights = new Module.Class({
    Name: 'Selection.AllHighlights',
    Extends: Xapian.Xapian,

    _init: function (props={}) {
        this.parent(props);
        this._set_needs_refresh(true);
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;
        return new QueryObject.QueryObject({
            limit: limit,
            tags_match_any: ['EknArticleObject'], // FIXME: Should be getting featured articles only
        });
    },
});
