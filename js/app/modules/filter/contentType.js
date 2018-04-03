// Copyright 2018 Endless Mobile, Inc.

/* exported ContentType */

const {DModel, GObject} = imports.gi;

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;

/**
 * Class: ContentType
 * Filter that includes only a content type
 *
 * This filter includes only object models of the content type
 * specified in its `content-type` string property.
 */
var ContentType = new Module.Class({
    Name: 'Filter.ContentType',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    Properties: {
        'content-type': GObject.ParamSpec.string('content-type', 'Content Type', 'Content Type to include',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    // Filter implementation
    include_impl(model) {
        return model.content_type.startsWith(this.content_type);
    },

    // Filter implementation
    modify_xapian_query_impl(query) {
        if (this.invert) {
            if (query.excluded_content_type && query.excluded_content_type.startsWith(this.content_type))
                return query;
            return DModel.Query.new_from_object(query, {
                excluded_content_type: this.content_type,
            });
        } else {
            if (query.content_type && query.content_type.startsWith(this.content_type))
                return query;
            return DModel.Query.new_from_object(query, {
                content_type: this.content_type,
            });
        }
    },
});
