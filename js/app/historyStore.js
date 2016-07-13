/* exported HistoryStore, get_default, set_default */

const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;

const ArticleObjectModel = imports.search.articleObjectModel;
const Actions = imports.app.actions;
const Engine = imports.search.engine;
const Dispatcher = imports.app.dispatcher;
const HistoryItem = imports.app.historyItem;
const MediaObjectModel = imports.search.mediaObjectModel;
const Pages = imports.app.pages;
const SetObjectModel = imports.search.setObjectModel;
const Utils = imports.app.utils;

const Direction = {
    BACKWARDS: 'backwards',
    FORWARDS: 'forwards',
};

/**
 * Class: HistoryStore
 *
 * A store containing the history state of the application.
 *
 */
const HistoryStore = new Lang.Class({
    Name: 'HistoryStore',
    Extends: Gio.SimpleActionGroup,

    Signals: {
        /**
         * Event: changed
         *
         * Emitted when the history item changes.
         */
        'changed': {},
    },

    _init: function (props={}) {
        this.parent(props);

        this._items = [];
        this._index = -1;
        this._direction = Direction.FORWARDS;

        let article_search_state = new Gio.SimpleAction({
            name: 'article-search-visible',
            state: new GLib.Variant('b', false),
        });
        this.add_action(article_search_state);
        article_search_state.connect('change-state', (action, variant) => {
            let item = this.get_current_item();
            if (item && item.page_type === Pages.ARTICLE)
                action.set_state(variant);
        });
        this._setup_action_group();

        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.HISTORY_BACK_CLICKED:
                    this.go_back();
                    break;
                case Actions.HISTORY_FORWARD_CLICKED:
                    this.go_forward();
                    break;
            }
        });
    },

    _setup_action_group: function () {
        let app = Gio.Application.get_default();
        // GApplication is not required, e.g. in tests
        if (!app)
            return;

        app.set_accels_for_action('store.article-search-visible',
            ['<primary>f']);
        app.get_windows().forEach(win =>
            win.insert_action_group('store', this));
        app.connect('window-added', (app, win) =>
            win.insert_action_group('store', this));
    },

    // Default signal handler
    on_changed: function () {
        this.change_action_state('article-search-visible',
            new GLib.Variant('b', false));
    },

    get_items: function () {
        return this._items;
    },

    get_current_index: function () {
        return this._index;
    },

    get_direction: function () {
        return this._direction;
    },

    get_current_item: function () {
        return this.get_items()[this.get_current_index()] || null;
    },

    can_go_back: function () {
        return this._index > 0;
    },

    can_go_forward: function () {
        return this._index < this._items.length - 1;
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

    // Common helper functions for history stores, not for use from other
    // modules...
    go_back: function () {
        if (!this.can_go_back())
            return;
        this._index--;
        this._direction = Direction.BACKWARDS;
        this.emit('changed');
    },

    go_forward: function () {
        if (!this.can_go_forward())
            return;
        this._index++;
        this._direction = Direction.FORWARDS;
        this.emit('changed');
    },

    set_current_item: function (item) {
        if (!this.get_current_item() || !this.get_current_item().equals(item)) {
            this._items = this._items.slice(0, this._index + 1);
            this._items.push(item);
            this.go_forward();
        }
    },

    set_current_item_from_props: function (props) {
        this.set_current_item(new HistoryItem.HistoryItem(props));
    },

    do_search: function (query, timestamp) {
        let sanitized_query = Utils.sanitize_query(query);
        if (sanitized_query.length === 0)
            return;

        Utils.record_search_metric(query);
        this.set_current_item_from_props({
            page_type: Pages.SEARCH,
            query: sanitized_query,
            timestamp: timestamp || Gdk.CURRENT_TIME,
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
                let old_item = this.get_current_item();
                this.set_current_item_from_props({
                    page_type: old_item.page_type,
                    model: old_item.model,
                    media_model: model,
                });
            }
        });
    },

    load_dbus_item: function (ekn_id, query, timestamp) {
        Engine.get_default().get_object_by_id(ekn_id, null, (engine, task) => {
            try {
                let model = engine.get_object_by_id_finish(task);
                this.set_current_item_from_props({
                    page_type: Pages.ARTICLE,
                    model: model,
                    query: query,
                    timestamp: timestamp || Gdk.CURRENT_TIME,
                });
            } catch (error) {
                logError(error);
            }
        });
    },

    close_lightbox: function () {
        let item = this.get_current_item();
        if (!item.media_model)
            return;
        let target_item = this.search_backwards(-1, item =>
            item.media_model === null);
        if (!target_item) {
            target_item = {
                page_type: item.page_type,
                query: item.query,
                context_label: item.context_label,
                timestamp: item.timestamp,
                model: item.model,
            };
        }
        this.set_current_item(HistoryItem.HistoryItem.new_from_object(target_item));
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
