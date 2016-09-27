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
        this._query_index = 0;
        this._error_state = false;
        this._exception = null;

        this.parent(props);
    },

    get loading() {
        return this._loading;
    },

    get can_load_more() {
        return this._can_load_more;
    },

    get in_error_state() {
        return this._error_state;
    },

    construct_query_object: function (limit, query_index) {
        void limit;
        void query_index;
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
            query = this.construct_query_object(limit, this._query_index);
            if (!query) {
                this._set_needs_refresh(false);
                return;
            }
        }

        this._loading = true;
        this.notify('loading');
        engine.get_objects_by_query(query, null, (engine, task) => {
            this._loading = false;
            this._set_needs_refresh(false);
            this.notify('loading');

            let results, info;
            try {
                [results, info] = engine.get_objects_by_query_finish(task);
                this._exception = null;
                if (this._error_state) {
                    this._error_state = false;
                    this.notify('in-error-state');
                }
            } catch (e) {
                logError(e, 'Failed to load content from engine');
                results = [];
                info = { more_results: null };
                this._exception = e;
                if (!this._error_state) {
                    this._error_state = true;
                    this.notify('in-error-state');
                }
                return;
            }
            let more = info.more_results;

            if (!more) {
                this._query_index++;
                more = this.construct_query_object(num_desired, this._query_index);
            }

            this._get_more = more;
            let can_load_more = !!more && (info.upper_bound > results.length);
            if (can_load_more !== this._can_load_more) {
                this._can_load_more = can_load_more;
                this.notify('can-load-more');
            }

            let results_added = results.filter(this.add_model, this);
            if (results_added.length < num_desired && this._can_load_more)
                this.queue_load_more(num_desired - results_added.length);

            this.emit_models_when_not_animating();
        });
    },

    clear: function () {
        this._get_more = null;
        this._query_index = 0;
        let reset_can_load_more = true;
        if (reset_can_load_more !== this._can_load_more) {
            this._can_load_more = reset_can_load_more;
            this.notify('can-load-more');
        }
        this._can_load_more = true;
        this._error_state = false;
        this._exception = null;
        this.parent();
    },

    get_error: function () {
        return this._exception;
    },
});
