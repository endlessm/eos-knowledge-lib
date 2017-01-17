/* exported ArticlesForSet */

// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;

const ContentForSet = imports.app.modules.selection.contentForSet;
const Module = imports.app.interfaces.module;

const ArticlesForSet = new Module.Class({
    Name: 'Selection.ArticlesForSet',
    Extends: ContentForSet.ContentForSet,

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;

        if (!this.model)
            return null;

        return Eknc.QueryObject.new_from_props({
            limit: limit,
            tags_match_any: this.model.child_tags,
            tags_match_all: ['EknArticleObject'],
            sort: Eknc.QueryObjectSort.SEQUENCE_NUMBER,
        });
    },
});
