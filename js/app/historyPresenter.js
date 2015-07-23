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

        /**
         * Property: history_buttons
         * History buttons that operate this presenter
         *
         * Pass an instance of <Endless.TopbarNavButton> to this property.
         *
         * Flags:
         *   Construct only
         */
        'history-buttons': GObject.ParamSpec.object('history-buttons',
            'History buttons', 'History buttons in the view',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
    },

    Signals: {
        /**
         * Event: history-item-changed
         *
         * Emitted when the history item changes, but ignores empty items (e.g.
         * searches with no results) when appropriate.
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

        this.history_model.bind_property('can-go-forward',
            this.history_buttons.forward_button, 'sensitive',
            GObject.BindingFlags.SYNC_CREATE);
        this.history_model.bind_property('can-go-back',
            this.history_buttons.back_button, 'sensitive',
            GObject.BindingFlags.SYNC_CREATE);


        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.HISTORY_BACK_CLICKED:
                    this.history_model.go_back();
                    break;
                case Actions.HISTORY_FORWARD_CLICKED:
                    this.history_model.go_forward();
                    break;
            }
        });

        this.history_model.connect('notify::current-item', this._notify_item.bind(this));
        this._last_item = null;
    },

    _notify_item: function () {
        let is_going_back = this.history_model.get_item(1) === this._last_item;
        let item = this.history_model.current_item;
        this._last_item = this.history_model.current_item;
        if (item.empty) {
            if (is_going_back && this.history_model.can_go_back) {
                this.history_model.go_back();
                return;
            }
            if (!is_going_back && this.history_model.can_go_forward) {
                this.history_model.go_forward();
                return;
            }
        }
        this.emit('history-item-changed', item, is_going_back);
    },

    set_current_item: function (item) {
        if (this.history_model.current_item === null || !this.history_model.current_item.equals(item))
            this.history_model.current_item = item;
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
        } while (item !== null && (item.empty || !match_fn(item)));
        return item;
    },
});
