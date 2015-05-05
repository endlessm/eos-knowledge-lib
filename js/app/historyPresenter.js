const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;

const HistoryItem = imports.app.historyItem;
const Window = imports.app.window;

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
         * Property: view
         * Knowledge app view
         *
         * Pass an instance of <Window> to this property.
         * In particular, this view holds the history buttons that controls
         * the history navigation.
         *
         * Flags:
         *   Construct only
         */
        'view': GObject.ParamSpec.object('view', 'View',
            'Knowledge app view',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
    },

    _init: function (props={}) {
        props.history_model = props.history_model || new EosKnowledgePrivate.HistoryModel();
        props.view = props.view || new Window.Window({
            application: props.application,
        });

        this.parent(props);

        this.history_model.bind_property('can-go-forward', this.view.history_buttons.forward_button, 'sensitive',
            GObject.BindingFlags.SYNC_CREATE);
        this.history_model.bind_property('can-go-back', this.view.history_buttons.back_button, 'sensitive',
            GObject.BindingFlags.SYNC_CREATE);
    },

    set_current_item: function (title, page_type, article_model=null, query_obj=null,
        article_origin_query_obj=null, article_origin_page=null) {
        let is_same_search = query_obj !== null &&
            this.history_model.current_item !== null &&
            this.history_model.current_item.query_obj !== null &&
            this.history_model.current_item.query_obj.query === query_obj.query;

        // If it's a request for an identical search, don't bother
        // adding it to the history model.
        if (!is_same_search) {
            this.history_model.current_item = new HistoryItem.HistoryItem({
                title: title,
                page_type: page_type,
                article_model: article_model,
                query_obj: query_obj,
                article_origin_query_obj: article_origin_query_obj,
                article_origin_page: article_origin_page,
            });
        }
    },

    go_forward: function () {
        this.history_model.go_forward();
    },

    go_back: function () {
        this.history_model.go_back();
    },
});
