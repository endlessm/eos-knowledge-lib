/* exported AllHighlights */

// Copyright 2016 Endless Mobile, Inc.

const GLib = imports.gi.GLib;

const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const Xapian = imports.app.modules.selection.xapian;

const AllHighlights = new Module.Class({
    Name: 'AllHighlightsSelection',
    Extends: Xapian.Xapian,

    construct_query_object: function (limit) {
        return new QueryObject.QueryObject({
            limit: limit,
            tags: ['EknArticleObject'], // FIXME: Should be getting featured articles only
        });
    },
});
