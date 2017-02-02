/* exported HistoryStore, get_default, set_default */

const Eknc = imports.gi.EosKnowledgeContent;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const HistoryItem = imports.app.historyItem;
const Pages = imports.app.pages;
const ReadingHistoryModel = imports.app.readingHistoryModel;
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

    Properties: {
        /**
         * Property: current-set
         *
         * The model for the current set in the history store.
         */
        'current-set': GObject.ParamSpec.object('current-set', 'current-set', 'current-set',
            GObject.ParamFlags.READABLE, Eknc.SetObjectModel),
        /**
         * Property: current-subset
         *
         * The model for the current subset in the history store.
         */
        'current-subset': GObject.ParamSpec.object('current-subset', 'current-subset', 'current-subset',
            GObject.ParamFlags.READABLE, Eknc.SetObjectModel),
        /**
         * Property: current-query
         *
         * The model for the current query in the history store.
         */
        'current-query': GObject.ParamSpec.string('current-query', 'current-query', 'current-query',
            GObject.ParamFlags.READABLE, ''),
        /**
         * Property: animating
         * Whether a page in this app is animating.
         */
        'animating': GObject.ParamSpec.boolean('animating',
            'Animating', 'Whether the app is animating',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, false),
    },

    _init: function (props={}) {
        this.parent(props);

        this._animating = false;
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
                case Actions.ITEM_CLICKED:
                    ReadingHistoryModel.get_default().mark_article_read(payload.model.ekn_id);
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

    set animating (v) {
        if (this._animating === v)
            return;
        this._animating = v;
        this.notify('animating');
    },

    get animating () {
        return this._animating;
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

    get current_subset () {
        if (this._current_subset)
            return this._current_subset;
        return null;
    },

    get current_query () {
        let item = this.search_backwards(0, (item) => item.query.length > 0);
        if (item)
            return item.query;
        return '';
    },

    get current_set () {
        let item = this.search_backwards(0, (item) => item.page_type === Pages.SET);
        if (item)
            return item.model;
        return null;
    },

    _update_index: function (delta) {
        let old_set = this.current_set;
        let old_query = this.current_query;
        this._index += delta;
        this.emit('changed');
        if (old_query !== this.current_query)
            this.notify('current-query');
        if (old_set !== this.current_set)
            this.notify('current-set');
    },

    // Common helper functions for history stores, not for use from other
    // modules...
    set_current_subset: function (model) {
        if (!model)
            return;
        if (!this._current_subset || (this._current_subset.ekn_id !== model.ekn_id)) {
            this._current_subset = model;
            this.notify('current-subset');
        }
    },

    go_back: function () {
        if (!this.can_go_back())
            return;
        this._direction = Direction.BACKWARDS;
        this._update_index(-1);
    },

    go_forward: function () {
        if (!this.can_go_forward())
            return;
        this._direction = Direction.FORWARDS;
        this._update_index(1);
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
        Eknc.Engine.get_default().get_object_promise(ekn_id)
        .then((model) => {
            if (model instanceof Eknc.ArticleObjectModel) {
                this.set_current_item_from_props({
                    page_type: Pages.ARTICLE,
                    model: model,
                });
            } else if (model instanceof Eknc.SetObjectModel) {
                this.set_current_item_from_props({
                    page_type: Pages.SET,
                    model: model,
                    context_label: model.title,
                });
            } else if (model instanceof Eknc.MediaObjectModel) {
                let old_item = this.get_current_item();
                this.set_current_item_from_props({
                    page_type: old_item.page_type,
                    model: old_item.model,
                    context: old_item.model ? old_item.model.resources : [],
                    media_model: model,
                });
            }
        })
        .catch(function (error) {
            logError(error);
        });
    },

    load_dbus_item: function (ekn_id, query, timestamp) {
        Eknc.Engine.get_default().get_object_promise(ekn_id)
        .then((model) => {
            if (model instanceof Eknc.ArticleObjectModel) {
                this.set_current_item_from_props({
                    page_type: Pages.ARTICLE,
                    model: model,
                    query: query,
                    timestamp: timestamp || Gdk.CURRENT_TIME,
                });
            } else if (model instanceof Eknc.SetObjectModel) {
                this.set_current_item_from_props({
                    page_type: Pages.SET,
                    model: model,
                    context_label: model.title,
                    timestamp: timestamp || Gdk.CURRENT_TIME,
                });
            }
        })
        .catch(function (error) {
            logError(error);
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
