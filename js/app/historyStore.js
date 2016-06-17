/* exported HistoryStore, get_default, set_default */

const GObject = imports.gi.GObject;

const ArticleObjectModel = imports.search.articleObjectModel;
const Actions = imports.app.actions;
const Engine = imports.search.engine;
const Dispatcher = imports.app.dispatcher;
const HistoryItem = imports.app.historyItem;
const MediaObjectModel = imports.search.mediaObjectModel;
const Pages = imports.app.pages;
const SetObjectModel = imports.search.setObjectModel;
const Utils = imports.app.utils;

/**
 * Class: HistoryStore
 *
 * A store containing the history state of the application.
 *
 */
const HistoryStore = new GObject.Class({
    Name: 'HistoryStore',

    Signals: {
        /**
         * Event: history-item-changed
         *
         * Emitted when the history item changes.
         *
         * Parameters:
         *   item - the history item
         *   backwards - true if we are currently navigating backwards
         */
        'history-item-changed': {
            param_types: [GObject.TYPE_OBJECT, GObject.TYPE_OBJECT, GObject.TYPE_BOOLEAN],
        },
    },

    _init: function (props={}) {
        this.parent(props);

        this._items = [];
        this._index = -1;

        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.HISTORY_BACK_CLICKED:
                    this._go_back();
                    break;
                case Actions.HISTORY_FORWARD_CLICKED:
                    this._go_forward();
                    break;
            }
        });

        this._dispatch_history_enabled();
    },

    _go_back: function () {
        if (!this._items || this._index <= 0)
            return;
        let last_item = this.get_current_item();
        this._index = this._index - 1;
        this.emit('history-item-changed', this.get_current_item(), last_item, true);
        this._dispatch_history_enabled();
    },

    _go_forward: function () {
        if (!this._items || this._index >= this._items.length - 1)
            return;
        let last_item = this.get_current_item();
        this._index = this._index + 1;
        this.emit('history-item-changed', this.get_current_item(), last_item, false);
        this._dispatch_history_enabled();
    },

    _dispatch_history_enabled: function () {
        let dispatcher = Dispatcher.get_default();
        dispatcher.dispatch({
            action_type: Actions.HISTORY_BACK_ENABLED_CHANGED,
            enabled: this._index > 0,
        });
        dispatcher.dispatch({
            action_type: Actions.HISTORY_FORWARD_ENABLED_CHANGED,
            enabled: this._index < this._items.length - 1,
        });
    },

    get_current_item: function () {
        return this._items[this._index] || null;
    },

    item_count: function () {
        return this._items.length;
    },

    set_current_item: function (item) {
        if (!this.get_current_item() || !this.get_current_item().equals(item)) {
            this._items = this._items.slice(0, this._index + 1);
            this._items.push(item);
            this._go_forward();
        }
    },

    set_current_item_from_props: function (props) {
        this.set_current_item(new HistoryItem.HistoryItem(props));
    },

    /**
     * Method: search_backwards
     *
     * Helper to search backwards in the history for an item. Takes a starting
     * offset and a match function, which should return true of a match, false
     * otherwise. Returns the matching item or null.
     */
    search_backwards: function (offset, match_fn) {
        let item;
        let index = this._index + offset;
        do {
            item = this._items[index--];
        } while (item && !match_fn(item));
        return item || null;
    },

    // Common helper functions for history stores...
    do_search: function (query) {
        let sanitized_query = Utils.sanitize_query(query);
        if (sanitized_query.length === 0)
            return;

        Utils.record_search_metric(query);
        this.set_current_item_from_props({
            page_type: Pages.SEARCH,
            query: sanitized_query,
        });
    },

    // This is by no means how all history stores need to handle showing
    // articles, sets and media. But because all our current stores handle these
    // the same after a link click, factoring out this common function. When we
    // diverge in future interactions we should revisit this decomposition.
    show_ekn_id: function (ekn_id) {
        Engine.get_default().get_object_by_id(ekn_id, null, (engine, task) => {
            let model;
            try {
                model = engine.get_object_by_id_finish(task);
            } catch (error) {
                logError(error);
                return;
            }

            if (model instanceof ArticleObjectModel.ArticleObjectModel) {
                this.set_current_item_from_props({
                    page_type: Pages.ARTICLE,
                    model: model,
                });
            } else if (model instanceof SetObjectModel.SetObjectModel) {
                this.set_current_item_from_props({
                    page_type: Pages.SET,
                    model: model,
                    context_label: model.title,
                });
            } else if (model instanceof MediaObjectModel.MediaObjectModel) {
                Dispatcher.get_default().dispatch({
                    action_type: Actions.SHOW_MEDIA,
                    model: model,
                });
            }
        });
    },
});

let [get_default, set_default] = (function () {
    let history_store = null;
    return [
        function () {
            if (history_store === null)
                history_store = new HistoryStore();
            return history_store;
        },
        function (store) {
            history_store = store;
        },
    ];
})();
