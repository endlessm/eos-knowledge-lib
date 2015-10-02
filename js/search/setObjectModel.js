// Copyright 2015 Endless Mobile, Inc.
/* exported SetObjectModel */

const Lang = imports.lang;

const ContentObjectModel = imports.search.contentObjectModel;

/**
 * Class: SetObjectModel
 * Models a set, which is a record that contains other records
 */
const SetObjectModel = new Lang.Class({
    Name: 'SetObjectModel',
    Extends: ContentObjectModel.ContentObjectModel,

    _init: function (props={}, json_ld=null) {
        if (json_ld)
            this._set_props_from_json_ld(props, json_ld);

        // FIXME: We can't have lists or functions as GObject properties at the
        // moment. Handle them before chaining with this.parent().
        Object.defineProperties(this, {
            /**
             * Property: child-tags
             * A list of tags that articles in this set are tagged with
             *
             * <child-tags> refers to the articles that are contained within a
             * set; those articles are all articles whose
             * <ContentObjectModel.tags> properties contain one of the tags in
             * the set's <child-tags> property.
             *
             * Note that <ContentObjectModel.tags> on a <SetObjectModel> refers
             * to the tags with which a set itself has been tagged.
             */
            'child_tags': {
                value: props.child_tags ? props.child_tags.slice() : [],
                writable: false,
            },
        });
        delete props.child_tags;

        this.parent(props, json_ld);
    },

    _set_props_from_json_ld: function (props, json_ld) {
        // Marshal properties specific to SetObjectModel
        if (json_ld.hasOwnProperty('childTags'))
            props.child_tags = json_ld.childTags.slice();
    },
});
