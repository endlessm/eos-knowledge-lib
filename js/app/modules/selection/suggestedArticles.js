/* exported SuggestedArticles */

// Copyright 2016 Endless Mobile, Inc.

const GLib = imports.gi.GLib;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const Utils = imports.app.utils;
const Xapian = imports.app.modules.selection.xapian;

const SuggestedArticles = new Module.Class({
    Name: 'Selection.SuggestedArticles',
    Extends: Xapian.Xapian,

    _init: function (props) {
        this.parent(props);
        this._query = '';

        // FIXME: This will go away after centralization of app state
        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.SEARCH_TEXT_ENTERED:
                    this._query = payload.query;
                    this.queue_load_more(4);
                    break;
            }
        });
    },

    _TOTAL_ARTICLES: 50,
    construct_query_object: function (limit) {
        let hash = Utils.dumb_hash(this._query);
        // FIXME: We still need a better way to issue a query for
        // 'random' articles. This just gets a random offset and then
        // requests articles (in order) starting from that point.
        let random_query = new QueryObject.QueryObject({
            offset: hash % this._TOTAL_ARTICLES,
            limit: limit,
            tags: ['EknArticleObject'],
        });

        return random_query;
    },

    get_models: function () {
        let models = [...this._models_by_id.values()];

        if (this._order) {
            models.sort(this._order.compare.bind(this._order));
        } else {
            let hash = Utils.dumb_hash(this._query);

            // Reseed the pseudorandom function so that we get the same random sequence
            GLib.random_set_seed(hash);

            // Generate a pseudorandom sequence of numbers to use to shuffle the array
            let rand_sequence = Array.apply(null, {length: this._models_by_id.size}).map(GLib.random_double);
            return Utils.shuffle(models, rand_sequence);
        }
        return models;
    },
});
