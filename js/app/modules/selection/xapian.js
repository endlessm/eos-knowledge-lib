/* exported Xapian */

// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;

const Engine = imports.search.engine;
const Module = imports.app.interfaces.module;
const Selection = imports.app.modules.selection.selection;

/**
 * Class: Selection.Xapian
 * A general, superclass for populating selection content using xapian
 * queries. Note that this superclass cannot be used directly itself. You must
 * subclass it and implement the construct_query_object method, which should
 * return a <Eknc.QueryObject> determining what content to fetch from
 * a xapian database.
 *
 * This superclass handles continuation-passing on the queue_load_more method.
 * If the selection determines that both more results are available
 * (by examining the result set metadata returned from xapian) and that more
 * results are required, it will automatically create a new query and fetch
 * more content.
 *
 */
const Xapian = new Module.Class({
    Name: 'Selection.Xapian',
    Extends: Selection.Selection,
    Abstract: true,

    _init: function (props={}) {
        this._loading = false;
        this._can_load_more = true;
        this._next_query = null;
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
        let query = this._next_query;

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
        engine.get_objects_for_query(query, null, (engine, task) => {
            this._loading = false;
            this._set_needs_refresh(false);
            this.notify('loading');

            let results, info;
            try {
                [results, info] = engine.get_objects_for_query_finish(task);
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

            // Since above, in the case of having a filter present, we
            // request 3 times our original num_desired, it is possible
            // that we end up with more results than we originally requested!
            // In that case we do not want to add those superfluous results to
            // the models map.
            let offset_for_next_query;
            let num_results_added = results.reduce((count, model, idx) => {
                if (count < num_desired) {
                    count += this.add_model(model) ? 1 : 0;
                    offset_for_next_query = idx + 1;
                }
                return count;
            }, 0);

            // If we got back less than we even asked for, then obviously there
            // are no more results to be fetched.
            let more_results_query;
            if (results.length < query.limit) {
                more_results_query = null;
            } else {
                // If we got back at least what we asked for, there is the
                // possibility that there are more results to be fetched. In
                // this case, we want the new offset to be equal to the old
                // offset plus however many models we had to step through
                // in order to obtain num_desired amount of filter-accepting
                // models. E.g. If we desired 5 models, and, out of the 10 we
                // got back, the first 5 passed the filter, then our new offset
                // is 5. But if, out of those 10, it was the latter 5 which
                // passed the filter, then our new offset should be 10.
                more_results_query = Eknc.QueryObject.new_from_object(query, {
                    offset: query.offset + offset_for_next_query,
                });
            }

            let new_query = false;
            if (!more_results_query) {
                this._query_index++;
                new_query = true;
                more_results_query = this.construct_query_object(num_desired, this._query_index);
            }

            this._next_query = more_results_query;
            let can_load_more = !!more_results_query && (info.upper_bound > results.length || new_query);
            if (can_load_more !== this._can_load_more) {
                this._can_load_more = can_load_more;
                this.notify('can-load-more');
            }

            if (num_results_added < num_desired && this._can_load_more) {
                this.queue_load_more(num_desired - num_results_added);
            }

            this.emit_models_when_not_animating();
        });
    },

    clear: function () {
        this._next_query = null;
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
