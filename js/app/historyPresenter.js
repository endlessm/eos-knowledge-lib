const GObject = imports.gi.GObject;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const HistoryItem = imports.app.historyItem;

/**
 * Class: HistoryPresenter
 *
 * A presenter for the navigation history functionality.
 *
 */
const HistoryPresenter = new GObject.Class({
    Name: 'HistoryPresenter',
    GTypeName: 'EknHistoryPresenter',

    Properties: {
        /**
         * Property: history-model
         * Handle to EOS knowledge History Model
         *
         * Pass an instance of <HistoryModel> to this property.
         * This is a property for purposes of dependency injection during
         * testing.
         *
         * Flags:
         *   Construct only
         */
        'history-model': GObject.ParamSpec.object('history-model', 'History Model',
            'Handle to EOS knowledge History Model',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
    },

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
            param_types: [HistoryItem.HistoryItem, GObject.TYPE_BOOLEAN],
        },
    },

    _init: function (props={}) {
        this.parent(props);

        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.HISTORY_BACK_CLICKED:
                    this.history_model.go_back();
                    this.emit('history-item-changed', this.history_model.current_item, true);
                    break;
                case Actions.HISTORY_FORWARD_CLICKED:
                    this.history_model.go_forward();
                    this.emit('history-item-changed', this.history_model.current_item, false);
                    break;
            }
        });

        this.history_model.connect('notify::can-go-back',
                                   () => this._dispatch_history_enabled());
        this.history_model.connect('notify::can-go-forward',
                                   () => this._dispatch_history_enabled());
        this._dispatch_history_enabled();
        this._last_item = null;
    },

    _dispatch_history_enabled: function () {
        let dispatcher = Dispatcher.get_default();
        dispatcher.dispatch({
            action_type: Actions.HISTORY_BACK_ENABLED_CHANGED,
            enabled: this.history_model.can_go_back,
        });
        dispatcher.dispatch({
            action_type: Actions.HISTORY_FORWARD_ENABLED_CHANGED,
            enabled: this.history_model.can_go_forward,
        });
    },

    item_count: function () {
        if (!this.history_model.current_item)
            return 0;
        return 1 + this.history_model.get_back_list().length + this.history_model.get_forward_list().length;
    },

    set_current_item: function (item) {
        if (this.history_model.current_item === null || !this.history_model.current_item.equals(item)) {
            this.history_model.current_item = item;
            this.emit('history-item-changed', this.history_model.current_item, false);
        }
    },

    set_current_item_from_props: function (props) {
        this.set_current_item(new HistoryItem.HistoryItem(props));
    },

    /**
     * Method: search_backwards
     *
     * Helper to search backwards in the history for an item. Takes a starting
     * index and a match function, which should return true of a match, false
     * otherwise. Returns the matching item or null.
     */
    search_backwards: function (index, match_fn) {
        let item;
        do {
            item = this.history_model.get_item(index--);
        } while (item !== null && !match_fn(item));
        return item;
    },
});
