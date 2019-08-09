/* exported Suggested */

// Copyright 2016 Endless Mobile, Inc.

const {DModel, GLib} = imports.gi;

const HistoryStore = imports.framework.historyStore;
const Module = imports.framework.interfaces.module;
const Utils = imports.framework.utils;
const Xapian = imports.framework.modules.selection.xapian;

var Suggested = new Module.Class({
    Name: 'Selection.Suggested',
    Extends: Xapian.Xapian,

    _init: function (props) {
        this.parent(props);
        this._hash = 0;
        HistoryStore.get_default().connect('notify::current-search-terms', () => {
            this._set_needs_refresh(true);
        });
    },

    _TOTAL_ARTICLES: 10,
    construct_query_object: function (limit, query_index) {
        let search_terms = HistoryStore.get_default().current_search_terms;
        if (query_index > 0 || search_terms.length === 0)
            return null;
        this._hash = Utils.dumb_hash(search_terms);
        // FIXME: We still need a better way to issue a query for
        // 'random' articles. This just gets a random offset and then
        // requests articles (in order) starting from that point.
        return new DModel.Query({
            offset: this._hash % this._TOTAL_ARTICLES,
            limit: limit,
        });
    },

    get_models: function () {
        let models = [...this._models_by_id.values()];

        if (this._order) {
            models.sort(this._order.compare.bind(this._order));
        } else {
            // Reseed the pseudorandom function so that we get the same random sequence
            GLib.random_set_seed(this._hash);

            // Generate a pseudorandom sequence of numbers to use to shuffle the array
            let rand_sequence = Array.from({length: this._models_by_id.size}, () => GLib.random_double());
            return Utils.shuffle(models, rand_sequence);
        }
        return models;
    },
});
