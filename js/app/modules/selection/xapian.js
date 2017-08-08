/* exported Xapian */

// Copyright 2016 Endless Mobile, Inc.

const Eknc = imports.gi.EosKnowledgeContent;

const Module = imports.app.interfaces.module;
const Selection = imports.app.modules.selection.selection;

/**
 * Class: Xapian
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

    _modify_query_object: function(query) {
        if (!query)
            return null;
        if (this._order)
            query = this._order.modify_xapian_query(query);
        if (this._filter)
            query = this._filter.modify_xapian_query(query);
        return query;
    },

    queue_load_more: function (num_desired) {
        if (this.loading)
            return;

        let engine = Eknc.Engine.get_default();
        let query = this._next_query;

        if (!query) {
            query = this.construct_query_object(num_desired, this._query_index);
            if (!query) {
                this._set_needs_refresh(false);
                return;
            }
            query = this._modify_query_object(query);
        }

        // In the case where we can only do sorting and filtering after the
        // fact, we need a workaround so that we get a reasonable number of
        // results from the database that we can present after sorting and
        // filtering, without having the UI jump around too much as new results
        // come in.
        // The heuristic of limit * 3 is a guess.
        if ((this._order && !this._order.can_modify_xapian_query()) ||
            (this._filter && !this._filter.can_modify_xapian_query())) {
            query = Eknc.QueryObject.new_from_object(query, {
                limit: query.limit * 3,
            });
        }

        this._loading = true;
        this.notify('loading');
        engine.query_promise(query)
        .then(({ models, upper_bound }) => {
            this._loading = false;
            this._set_needs_refresh(false);
            this.notify('loading');
            this._exception = null;
            if (this._error_state) {
                this._error_state = false;
                this.notify('in-error-state');
            }

            // Since above, in the case of the order/filter workaround, we
            // request 3 times our original num_desired, it is possible
            // that we end up with more results than we originally requested!
            // In that case we do not want to add those superfluous results to
            // the models map.
            let offset_for_next_query;
            let num_results_added = models.reduce((count, model, idx) => {
                if (count < num_desired) {
                    count += this.add_model(model) ? 1 : 0;
                    offset_for_next_query = idx + 1;
                }
                return count;
            }, 0);

            // If we got back less than we even asked for, then obviously there
            // are no more results to be fetched.
            let more_results_query;
            if (models.length < query.limit) {
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
                more_results_query = this._modify_query_object(more_results_query);
            }

            this._next_query = more_results_query;
            let can_load_more = !!more_results_query && (upper_bound > models.length || new_query);
            if (can_load_more !== this._can_load_more) {
                this._can_load_more = can_load_more;
                this.notify('can-load-more');
            }

            if (num_results_added < num_desired && this._can_load_more) {
                this.queue_load_more(num_desired - num_results_added);
            }

            this.emit_models_when_not_animating();
        })
        .catch((error) => {
            logError(error, 'Failed to load content from engine');
            this._exception = error;
            if (!this._error_state) {
                this._error_state = true;
                this.notify('in-error-state');
            }
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
