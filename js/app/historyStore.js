/* exported HistoryStore, get_default, set_default */

const {DModel, Gdk, Gio, GLib, Gtk, GObject} = imports.gi;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const EntryPoints = imports.app.entryPoints;
const HistoryItem = imports.app.historyItem;
const Pages = imports.app.pages;
const ReadingHistoryModel = imports.app.readingHistoryModel;
const Utils = imports.app.utils;
const WebShareDialog = imports.app.widgets.webShareDialog;

let _ = imports.gettext.dgettext.bind(null, imports.app.config.GETTEXT_PACKAGE);

var Direction = {
    BACKWARDS: 'backwards',
    FORWARDS: 'forwards',
};

var Network = Utils.define_enum(['FACEBOOK', 'TWITTER', 'WHATSAPP']);

/**
 * Class: HistoryStore
 *
 * A store containing the history state of the application.
 *
 */
var HistoryStore = new Lang.Class({
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
            GObject.ParamFlags.READABLE, DModel.Set),
        /**
         * Property: current-subset
         *
         * The model for the current subset in the history store.
         */
        'current-subset': GObject.ParamSpec.object('current-subset', 'current-subset', 'current-subset',
            GObject.ParamFlags.READABLE, DModel.Set),
        /**
         * Property: current-search-terms
         *
         * The model for the current query in the history store.
         */
        'current-search-terms': GObject.ParamSpec.string('current-search-terms',
            'current-search-terms', 'current-search-terms',
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
        this._animating = false;
        this._items = [];
        this._index = -1;
        this._direction = Direction.FORWARDS;
        this.parent(props);

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
                    ReadingHistoryModel.get_default().mark_article_read(payload.model.id);
                    break;
                case Actions.SHARE:
                    this.share(payload.network);
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

    _start_content_access_metric: function(model, entry_point) {
        let old_item = this._direction === Direction.FORWARDS ?
            this.get_previous_item() : this.get_next_item();
        if (old_item && old_item.model && old_item.model.id === model.id)
            return;

        Utils.start_content_access_metric(model, entry_point);
    },

    // Default signal handler
    on_changed: function () {
        let old_item = this._direction === Direction.FORWARDS ?
            this.get_previous_item() : this.get_next_item();
        let item = this.get_current_item();

        if (!(item.model instanceof DModel.Media) &&
            old_item && old_item.model && old_item.page_type === Pages.ARTICLE &&
            (!item.model || old_item.model.id !== item.model.id))
            Utils.stop_content_access_metric(old_item.model);

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

    get_previous_item: function () {
        return this.get_items()[this.get_current_index() - 1] || null;
    },

    get_next_item: function () {
        return this.get_items()[this.get_current_index() + 1] || null;
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

    get current_search_terms() {
        let item = this.search_backwards(0,
            ({search_terms}) => search_terms.length > 0);
        if (item)
            return item.search_terms;
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
        let old_search_terms = this.current_search_terms;
        this._index += delta;
        this.emit('changed');
        if (old_search_terms !== this.current_search_terms)
            this.notify('current-search-terms');
        if (old_set !== this.current_set)
            this.notify('current-set');
    },

    // Common helper functions for history stores, not for use from other
    // modules...
    set_current_subset: function (model) {
        if (!model)
            return;
        if (!this._current_subset || (this._current_subset.id !== model.id)) {
            this._current_subset = model;
            this.notify('current-subset');
        }
    },

    go_back: function () {
        if (!this.can_go_back())
            return;
        this._direction = Direction.BACKWARDS;
        this._update_index(-1);

        let item = this.get_current_item();
        if (item && item.model && item.page_type === Pages.ARTICLE)
            this._start_content_access_metric(item.model,
                EntryPoints.NAV_BUTTON_CLICKED);
    },

    go_forward: function () {
        if (!this.can_go_forward())
            return;
        this._direction = Direction.FORWARDS;
        this._update_index(1);

        let item = this.get_current_item();
        if (item && item.model && item.page_type === Pages.ARTICLE)
            this._start_content_access_metric(item.model,
                EntryPoints.NAV_BUTTON_CLICKED);
    },

    set_current_item: function (item, entry_point) {
        if (!this.get_current_item() || !this.get_current_item().equals(item)) {
            this._items = this._items.slice(0, this._index + 1);
            this._items.push(item);
            this._direction = Direction.FORWARDS;
            this._update_index(1);
        }
        if (entry_point && item && item.model && item.page_type === Pages.ARTICLE)
            this._start_content_access_metric(item.model, entry_point);
    },

    set_current_item_from_props: function (props, entry_point) {
        this.set_current_item(new HistoryItem.HistoryItem(props), entry_point);
    },

    do_search: function (search_terms, timestamp) {
        let sanitized_terms = Utils.sanitize_search_terms(search_terms);
        if (sanitized_terms.length === 0)
            return;

        Utils.record_search_metric(search_terms);
        this.set_current_item_from_props({
            page_type: Pages.SEARCH,
            search_terms: sanitized_terms,
            timestamp: timestamp || Gdk.CURRENT_TIME,
        });
    },

    // This is by no means how all history stores need to handle showing
    // articles, sets and media. But because all our current stores handle these
    // the same after a link click, factoring out this common function. When we
    // diverge in future interactions we should revisit this decomposition.
    show_id: function (id) {
        DModel.Engine.get_default().get_object_promise(id)
        .then((model) => {
            if (model instanceof DModel.Article) {
                this.set_current_item_from_props({
                    page_type: Pages.ARTICLE,
                    model: model,
                }, EntryPoints.ARTICLE_LINK_CLICKED);
            } else if (model instanceof DModel.Set) {
                this.set_current_item_from_props({
                    page_type: Pages.SET,
                    model: model,
                    context_label: model.title,
                });
            } else if (model instanceof DModel.Media) {
                let old_item = this.get_current_item();
                this.set_current_item_from_props({
                    page_type: old_item.page_type,
                    model: old_item.model,
                    context: old_item.model ? old_item.model.resources : [],
                    media_model: model,
                }, EntryPoints.ARTICLE_LINK_CLICKED);
            }
        })
        .catch(function (error) {
            logError(error);
        });
    },

    load_dbus_item: function (id, search_terms, timestamp) {
        DModel.Engine.get_default().get_object_promise(id)
        .then((model) => {
            if (model instanceof DModel.Article ||
                model instanceof DModel.Video ||
                model instanceof DModel.Audio) {
                this.set_current_item_from_props({
                    page_type: Pages.ARTICLE,
                    model: model,
                    search_terms: search_terms,
                    timestamp: timestamp || Gdk.CURRENT_TIME,
                }, EntryPoints.DBUS_CALL);
            } else if (model instanceof DModel.Set) {
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
        if (!item || !item.media_model)
            return;
        let target_item = this.search_backwards(-1, item =>
            item.media_model === null);
        if (!target_item) {
            target_item = {
                page_type: item.page_type,
                search_terms: item.search_terms,
                context_label: item.context_label,
                timestamp: item.timestamp,
                model: item.model,
            };
        }
        this.set_current_item(HistoryItem.HistoryItem.new_from_object(target_item));
    },

    /**
     * Method: share
     *
     * Share current item on a social network.
     */
    share: function (network) {
        let item = this.get_current_item();
        if (!item || !item.can_share)
            return;

        let model = item.media_model || item.model;
        let app = Gio.Application.get_default();
        let original_uri = encodeURIComponent(model.original_uri);
        let redirect_uri = null;
        let uri = null;

        switch(network) {
            case Network.FACEBOOK:
                redirect_uri = 'https://www.facebook.com/connect/login_success.html';
                uri = 'https://www.facebook.com/dialog/share?app_id=407909575958642&display=popup&quote=Shared%20from%20Endless&href='
                      + original_uri + '&redirect_uri=' + encodeURIComponent(redirect_uri);
                break;
            case Network.TWITTER:
                uri = 'https://twitter.com/intent/tweet?hashtags=SharedFromEndless&original_referer=https%3A%2F%2Fendlessos.com&url='
                      + original_uri;
                break;
            case Network.WHATSAPP:
                uri = 'https://api.whatsapp.com/send?text=' + original_uri +
                      '%20' + encodeURIComponent (_("Shared from Endless"));
                break;
            default:
                logError(new Error('Unknown social network '+ network));
                return;
        }

        if (network === Network.FACEBOOK) {
            let dialog = new WebShareDialog.WebShareDialog ({
                transient_for: (app) ? app.get_active_window() : null,
                modal: true,
                provider: 'facebook',
                redirect_uri: redirect_uri,
                uri: uri,
            });

            /*
             * If the user shares the link we get a redirect uri with the post id
             *   https://www.facebook.com/connect/login_success.html?post_id=10155405629303127#_=_
             *
             * Or an error code if the user canceled the dialog
             *   https://www.facebook.com/connect/login_success.html?error_code=4201&error_message=User%20canceled%20the%20Dialog%20flow#_=_
             */
            dialog.connect('transaction-done', (obj, redirect_uri) => {
                if (redirect_uri) {
                    let uri = Utils.parse_uri (redirect_uri, true);
                    let canceled = !(uri && uri.query && uri.query.post_id);
                    Utils.record_share_metric(model, network, canceled);
                } else {
                    /* A null redirect_uri means the dialog was closed */
                    Utils.record_share_metric(model, network, true);
                }
            });

            dialog.show();
        }
        else {
            /* Open share uri in system browser */
            Gtk.show_uri_on_window (app ? app.get_active_window() : null, uri, Gdk.CURRENT_TIME);

            /* We have no way to know if sharing was performed or not */
            Utils.record_share_metric(model, network);
        }
    },
});

var [get_default, set_default] = (function () {
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
