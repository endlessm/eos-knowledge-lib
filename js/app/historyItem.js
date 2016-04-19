const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;

const ContentObjectModel = imports.search.contentObjectModel;
const Knowledge = imports.app.knowledge;

/**
 * Class: HistoryItem
 *
 * An object to be used by a HistoryModel in order to keep track of the pages
 * that a user visits. Each HistoryItem contains the properties necessary
 * to recreate that page. This includes query parameters in the case of search
 * and article pages.
 *
 */
const HistoryItem = new Knowledge.Class({
    Name: 'HistoryItem',
    Extends: GObject.Object,
    Implements: [ EosKnowledgePrivate.HistoryItemModel ],
    Properties: {
        'title': GObject.ParamSpec.override('title',
            EosKnowledgePrivate.HistoryItemModel),
        /**
         * Property: page-type
         *
         * A string that stores the type of page that corresponds to a history item.
         * Supported page types are 'search', 'section', 'article', and 'home'.
         */
        'page-type': GObject.ParamSpec.string('page-type', 'Page Type',
            'The type of page of the history object. Either \'search\', \'section\', \'article\', or \'home\'',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        /**
         * Property: model
         * Content object model representing this page
         *
         * For 'article' pages, a <ArticleObjectModel> of the currently
         * displayed article. For 'section' pages, a <ContentObjectModel> of the
         * currently displayed set. Null for other pages.
         */
        'model': GObject.ParamSpec.object('model', 'Model',
            'Content object model representing this page',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ContentObjectModel.ContentObjectModel),
        /**
         * Property: query
         *
         * A query string entered by the user causing navigation to this history
         * item.
         */
        'query': GObject.ParamSpec.string('query', 'Query',
            'The search string entered when navigating to this page',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        /**
         * Property: context-label
         *
         * A context label describing what category this item belongs to.
         */
        'context-label': GObject.ParamSpec.string('context-label', 'Context label',
            'The context label describing what category this item belongs to',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        /**
         * Property: from-global-search
         *
         * True if this history object was activated from global search,
         * currently only used for reader app standalone page, which shows a
         * different banner in that case.
         */
        'from-global-search': GObject.ParamSpec.boolean('from-global-search',
            'From Global Search', 'From Global Search',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, false),
    },

    _init: function (props={}) {
        Object.defineProperties(this, {
            /**
             * Property: context
             * List of models this model was accessed from.
             *
             * For 'article' pages, a list of articles from which the currently
             * viewed article page was selected, or null.
             */
            'context': {
                value: props.context ? props.context.slice(0) : [],
                writable: false,
            },
        });
        delete props.context;

        this.parent(props);
    },

    get title() {
        return this._title;
    },

    set title(value) {
        this._title = value;
    },

    equals: function (item) {
        if (this.model)
            return this.page_type === item.page_type &&
            (this.model === null && item.model === null || this.model.ekn_id === item.model.ekn_id) &&
            this.from_global_search === item.from_global_search;
        return this.page_type === item.page_type &&
            this.query === item.query &&
            this.from_global_search === item.from_global_search;
    },
});

/**
 * Function: new_from_object
 */
HistoryItem.new_from_object = function (source) {
    let props = {};
    for (let prop in source) {
        if (source.hasOwnProperty(prop) && prop.substring(0, 1) !== '_')
            props[prop] = source[prop];
    }
    return new HistoryItem(props);
};
