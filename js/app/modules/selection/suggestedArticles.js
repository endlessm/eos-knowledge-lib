/* exported SuggestedArticles */

// Copyright 2016 Endless Mobile, Inc.

const GLib = imports.gi.GLib;

const Module = imports.app.interfaces.module;
const HistoryStore = imports.app.historyStore;
const QueryObject = imports.search.queryObject;
const Utils = imports.app.utils;
const Xapian = imports.app.modules.selection.xapian;

const SuggestedArticles = new Module.Class({
    Name: 'Selection.SuggestedArticles',
    Extends: Xapian.Xapian,

    _init: function (props) {
        this.parent(props);
        this._hash = 0;
        HistoryStore.get_default().connect('changed', this._on_history_changed.bind(this));
    },

    _on_history_changed: function () {
        this.clear();
    },

    _TOTAL_ARTICLES: 50,
    construct_query_object: function (limit, query_index) {
        let item = HistoryStore.get_default().get_current_item();
        if (!item || !item.query)
            throw new Error('This selection only works when there are search terms');

        if (query_index > 0)
            return null;
        this._hash = Utils.dumb_hash(item.query);
        // FIXME: We still need a better way to issue a query for
        // 'random' articles. This just gets a random offset and then
        // requests articles (in order) starting from that point.
        let random_query = new QueryObject.QueryObject({
            offset: this._hash % this._TOTAL_ARTICLES,
            limit: limit,
            tags_match_any: ['EknArticleObject'],
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
