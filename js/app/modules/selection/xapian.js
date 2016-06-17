/* exported Xapian */

// Copyright 2016 Endless Mobile, Inc.

const Engine = imports.search.engine;
const Module = imports.app.interfaces.module;
const Selection = imports.app.modules.selection.selection;

const Xapian = new Module.Class({
    Name: 'Selection.Xapian',
    Extends: Selection.Selection,
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
        throw new Error('You should be implementing construct_query_object in your subclass');
    },

    queue_load_more: function (num_desired) {
        if (this.loading)
            return;

        let engine = Engine.get_default();
        let query = this._get_more;

        if (!query) {
            let limit = num_desired;
            if (this._filter)
                limit *= 3;  // FIXME: Find a better heuristic for compensating for models lost to filter
            query = this.construct_query_object(limit);
        }

        this._loading = true;
        this.notify('loading');
        engine.get_objects_by_query(query, null, (engine, task) => {
            this._loading = false;
            this.notify('loading');

            let results, more;
            try {
                [results, more] = engine.get_objects_by_query_finish(task);
            } catch (e) {
                logError(e, 'Failed to load content from engine');
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
            if (results_added.length > 0) {
                this.emit('models-changed');
            }
            if (results_added.length < num_desired && this._can_load_more)
                this.queue_load_more(num_desired - results_added.length);
        });
    },

    clear: function () {
        this._get_more = null;
        this.parent();
    },
});
