// Copyright 2016 Endless Mobile, Inc.

/* exported Sets */

const Eknc = imports.gi.EosKnowledgeContent;
const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;

const Sets = new Module.Class({
    Name: 'Filter.Sets',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    // Filter implementation
    include_impl: function (model) {
        return (model.tags.indexOf('EknSetObject') !== -1);
    },

    // Filter implementation
    modify_xapian_query: function (query) {
        if (this.invert) {
            if (query.excluded_tags.indexOf('EknSetObject') !== -1)
                return query;
            return Eknc.QueryObject.new_from_object(query, {
                excluded_tags: query.excluded_tags.concat(['EknSetObject']),
            });
        } else {
            if (query.tags_match_all.indexOf('EknSetObject') !== -1)
                return query;
            return Eknc.QueryObject.new_from_object(query, {
                tags_match_all: query.tags_match_all.concat(['EknSetObject']),
            });
        }
    },
});
