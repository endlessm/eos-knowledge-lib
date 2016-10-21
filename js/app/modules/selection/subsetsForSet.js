/* exported SubsetsForSet */

// Copyright 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;

const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const Xapian = imports.app.modules.selection.xapian;

const SubsetsForSet = new Module.Class({
    Name: 'Selection.SubsetsForSet',
    Extends: Xapian.Xapian,
    Properties: {
        /**
         * Property: top-level-only
         * Whether this content group has more content to show
         */
        'top-level-only': GObject.ParamSpec.boolean('top-level-only',
            'Top level only', 'Only refresh when top level set changes',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
    },

    _init: function (props={}) {
        this.parent(props);
        if (this.global) {
            let property_name = 'current-set';
            if (this.top_level_only) {
                property_name = 'current-top-level-set';
            }
            this.model = HistoryStore.get_default()[property_name.replace('-', '_', 'g')];
            HistoryStore.get_default().connect('notify::' + property_name, () => {
                this.model = HistoryStore.get_default()[property_name.replace('-', '_', 'g')];
                this._set_needs_refresh(true);
            });
        }
        this._set_needs_refresh(true);
    },

    construct_query_object: function (limit, query_index) {
        if (query_index > 0)
            return null;

        if (!this.model)
            return null;

        return new QueryObject.QueryObject({
            limit: limit,
            tags_match_any: this.model.child_tags,
            tags_match_all: ['EknSetObject'],
            sort: QueryObject.QueryObjectSort.SEQUENCE_NUMBER,
        });
    },
});
