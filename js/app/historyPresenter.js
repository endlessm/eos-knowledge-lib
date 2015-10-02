const GObject = imports.gi.GObject;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const HistoryItem = imports.app.historyItem;
const Utils = imports.search.utils;

/**
 * Enum: Direction
 *
 * FOWARDS - Forward in time in the history model.
 * BACKWARDS - Backward in time in the history model.
 */
const Direction = Utils.define_enum(['BACKWARDS', 'FORWARDS']);

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
         * Emitted when the history item changes, but ignores empty items (e.g.
         * searches with no results) when appropriate.
         *
         * Parameters:
         *   item - the history item
         *   direction - the <Direction> we are navigating in.
         */
        'history-item-changed': {
            param_types: [HistoryItem.HistoryItem, GObject.TYPE_UINT],
        },
    },

    _init: function (props={}) {
        this.parent(props);

        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.HISTORY_BACK_CLICKED:
                    this._update_item(this._get_back_item(), Direction.BACKWARDS);
                    break;
                case Actions.HISTORY_FORWARD_CLICKED:
                    this._update_item(this._get_forward_item(), Direction.FORWARDS);
                    break;
            }
        });
        this._dispatch_history_enabled();
        this.history_model.connect('notify::current-item', this._dispatch_history_enabled.bind(this));
    },

    _get_back_item: function () {
        if (!this.history_model.can_go_back)
            return null;
        return this.search(-1, Direction.BACKWARDS, (item) => {
            return !item.equals(this.history_model.current_item);
        });
    },

    _get_forward_item: function () {
        if (!this.history_model.can_go_forward)
            return null;
        let forward_item = this.search(1, Direction.FORWARDS, (item) => {
            return !item.equals(this.history_model.current_item);
        });
        if (forward_item === null)
            forward_item = this.history_model.get_forward_list().pop();
        return forward_item;
    },

    _dispatch_history_enabled: function () {
        let dispatcher = Dispatcher.get_default();
        dispatcher.dispatch({
            action_type: Actions.HISTORY_BACK_ENABLED_CHANGED,
            enabled: this._get_back_item() !== null,
        });
        dispatcher.dispatch({
            action_type: Actions.HISTORY_FORWARD_ENABLED_CHANGED,
            enabled: this._get_forward_item() !== null,
        });
    },

    _update_item: function (item, direction) {
        if (item === null)
            return;
        this.history_model.current_item = item;
        this._dispatch_history_enabled();
        this.emit('history-item-changed', item, direction);
    },

    set_current_item: function (item) {
        if (this.history_model.current_item === null || !this.history_model.current_item.equals(item)) {
            this.history_model.current_item = item;
            this.emit('history-item-changed', item, Direction.FORWARDS);
        }
    },

    set_current_item_from_props: function (props) {
        this.set_current_item(new HistoryItem.HistoryItem(props));
    },

    /**
     * Method: search
     *
     * Helper to search in the history for an item. Skips empty history items.
     *
     * Parameters:
     *   index - history index to start at
     *   direction - direction to search in
     *   match - callback which takes in an item and returns true for a match
     */
    search: function (index, direction, match) {
        let item;
        do {
            item = this.history_model.get_item(index);
            index = direction === Direction.FORWARDS ? index + 1 : index - 1;
        } while (item !== null && (item.empty || !match(item)));
        return item;
    },
});
