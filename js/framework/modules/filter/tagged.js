// Copyright 2017 Endless Mobile, Inc.

/* exported Tagged */

const {DModel, GObject} = imports.gi;

const Filter = imports.framework.interfaces.filter;
const Module = imports.framework.interfaces.module;

/**
 * Class: Tagged
 * Filter that includes only content tagged with a certain tag
 *
 * This filter includes only content object models that are tagged with the
 * string in its `tag` property.
 */
var Tagged = new Module.Class({
    Name: 'Filter.Tagged',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    Properties: {
        'tag': GObject.ParamSpec.string('tag', 'Tag', 'Tag to include',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    // Filter implementation
    include_impl: function (model) {
        return (model.tags.indexOf(this.tag) !== -1);
    },

    // Filter implementation
    modify_xapian_query_impl: function (query) {
        if (this.invert) {
            if (query.excluded_tags.indexOf(this.tag) !== -1)
                return query;
            return DModel.Query.new_from_object(query, {
                excluded_tags: query.excluded_tags.concat([this.tag]),
            });
        } else {
            if (query.tags_match_all.indexOf(this.tag) !== -1)
                return query;
            return DModel.Query.new_from_object(query, {
                tags_match_all: query.tags_match_all.concat([this.tag]),
            });
        }
    },
});
