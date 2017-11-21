/* exported Suggested */

// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;
const GLib = imports.gi.GLib;

const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;
const Xapian = imports.app.modules.selection.xapian;

var Suggested = new Module.Class({
    Name: 'Selection.Suggested',
    Extends: Xapian.Xapian,

    _init: function (props) {
        this.parent(props);
        this._hash = 0;
        HistoryStore.get_default().connect('notify::current-query', () => {
            this._set_needs_refresh(true);
        });
    },

    _TOTAL_ARTICLES: 10,
    construct_query_object: function (limit, query_index) {
        let query = HistoryStore.get_default().current_query;
        if (query_index > 0 || query.length === 0)
            return null;
        this._hash = Utils.dumb_hash(query);
        // FIXME: We still need a better way to issue a query for
        // 'random' articles. This just gets a random offset and then
        // requests articles (in order) starting from that point.
        let random_query = Eknc.QueryObject.new_from_props({
            offset: this._hash % this._TOTAL_ARTICLES,
            limit: limit,
        });

        return random_query;
    },

    get_models: function () {
        let models = [...this._models_by_id.values()];

        if (this._order) {
            models.sort(this._order.compare.bind(this._order));
        } else {
            // Reseed the pseudorandom function so that we get the same random sequence
            GLib.random_set_seed(this._hash);

            // Generate a pseudorandom sequence of numbers to use to shuffle the array
            let rand_sequence = Array.apply(null, {length: this._models_by_id.size}).map(GLib.random_double);
            return Utils.shuffle(models, rand_sequence);
        }
        return models;
    },
});
