/* exported Xapian */

// Copyright 2016 Endless Mobile, Inc.

const Collection = imports.app.modules.collection.collection;
const Engine = imports.search.engine;
const Module = imports.app.interfaces.module;

const Xapian = new Module.Class({
    Name: 'XapianCollection',
    Extends: Collection.Collection,
    Abstract: true,

    _init: function (props={}) {
        this._loading = false;
        this._can_load_more = true;
        this._get_more = null;

        this.parent(props);
    },

    get loading() {
        return this._loading;
    },

    get can_load_more() {
        return this._can_load_more;
    },

    construct_query_object: function (limit) {
        void limit;
        throw new Error('You should be implementing this in your subclass');
    },

    load_more: function (num_desired) {
        if (this.loading)
            return;

        let engine = Engine.get_default();
        let query = this._get_more;

        if (!query) {
            let limit = num_desired;
            if (this._filter)
                limit *= 3;  // whats a good heuristic
            query = this.construct_query_object(limit);
        }

        this._loading = true;
        this.notify('loading');
        engine.get_objects_by_query(query, null, (engine, inner_task) => {
            this._loading = false;
            this.notify('loading');

            let results, more;
            try {
                [results, more] = engine.get_objects_by_query_finish(inner_task);
            } catch (e) {
                results = [];
                more = null;
            }

            this._get_more = more;
            let can_load_more = !!more;
            if (can_load_more !== this._can_load_more) {
                this._can_load_more = can_load_more;
                this.notify('can-load-more');
            }

            let results_added = results.filter(this.add_model, this);
            if (results_added.length > 0)
                this.emit('models-changed');
            if (results_added.length < num_desired && this._can_load_more)
                this.load_more(num_desired - results_added.length);
        });
    },
});
