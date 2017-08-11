/* exported FeaturedFirst */

// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;
const GLib = imports.gi.GLib;

const Module = imports.app.interfaces.module;
const Xapian = imports.app.modules.selection.xapian;

/**
 * Class: FeaturedFirst
 * Selection that gets all featured content before non-featured content
 *
 * FIXME: This should be implemented as Selection.All plus (the not currently
 * existing) Order.Featured, but currently it is not possible to sort by
 * featured status in one Xapian query.
 *
 * When that becomes possible, this module will be removed.
 */
var FeaturedFirst = new Module.Class({
    Name: 'Selection.FeaturedFirst',
    Extends: Xapian.Xapian,

    _init: function (props={}) {
        this.parent(props);
        this._set_needs_refresh(true);
    },

    construct_query_object: function (limit, query_index) {
        if (query_index == 0) {
            return Eknc.QueryObject.new_from_props({
                limit: limit,
                tags_match_all: ['EknFeaturedTag'],
            });
        } else if (query_index == 1) {
            return Eknc.QueryObject.new_from_props({
                limit: limit,
                excluded_tags: ['EknFeaturedTag'],
            });
        }

        // All other indexes (>= 2) should return null
        return null;
    },
});
