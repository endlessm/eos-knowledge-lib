const Endless = imports.gi.Endless;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;

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

    _init: function (props={}) {
        props.history_model = props.history_model || new EosKnowledgePrivate.HistoryModel();
        props.history_buttons = props.history_buttons || new Endless.TopbarNavButton();

        this.parent(props);

        this.history_model.bind_property('can-go-forward',
            this.history_buttons.forward_button, 'sensitive',
            GObject.BindingFlags.SYNC_CREATE);
        this.history_model.bind_property('can-go-back',
            this.history_buttons.back_button, 'sensitive',
            GObject.BindingFlags.SYNC_CREATE);
    },

    set_current_item: function (props) {
        if (!props.hasOwnProperty('page_type'))
            throw new Error('Current history item has no page_type property.');
        let is_same_search = props.hasOwnProperty('query_obj') &&
            this.history_model.current_item !== null &&
            this.history_model.current_item.hasOwnProperty('query_obj') &&
            this.history_model.current_item.query_obj !== null &&
            this.history_model.current_item.query_obj.query === props.query_obj.query;

        // If it's a request for an identical search, don't bother
        // adding it to the history model.
        if (!is_same_search) {
            this.history_model.current_item = new HistoryItem.HistoryItem(props);
        }
    },

    go_forward: function () {
        let model = this.history_model;

        // Skip over history items with no results.
        do {
            model.go_forward();
        } while (model.current_item.empty && model.can_go_forward);
    },

    go_back: function () {
        let model = this.history_model;

        // Skip over history items with no results.
        do {
            model.go_back();
        } while (model.current_item.empty && model.can_go_back);
    },
});
