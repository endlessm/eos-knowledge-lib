/* exported HistoryItem, ARTICLE_PAGE, BACK_COVER, CATEGORIES_PAGE, HOME_PAGE,
OVERVIEW_PAGE, SEARCH_PAGE, SECTION_PAGE */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const ContentObjectModel = imports.search.contentObjectModel;

/**
 * Constant: ARTICLE_PAGE
 * Value for <HistoryItem.page-type>
 */
const ARTICLE_PAGE = 'article';
/**
 * Constant: BACK_COVER
 * Value for <HistoryItem.page-type>
 */
const BACK_COVER = 'done';
// etc.
const CATEGORIES_PAGE = 'categories';
const HOME_PAGE = 'home';
const OVERVIEW_PAGE = 'overview';
const SEARCH_PAGE = 'search';
const SECTION_PAGE = 'section';

/**
 * Class: HistoryItem
 *
 * An object to be used by a HistoryModel in order to keep track of the pages
 * that a user visits. Each HistoryItem contains the properties necessary
 * to recreate that page. This includes query parameters in the case of search
 * and article pages.
 *
 */
const HistoryItem = new Lang.Class({
    Name: 'HistoryItem',
    Extends: GObject.Object,
    Implements: [ EosKnowledgePrivate.HistoryItemModel ],
    Properties: {
        /**
         * Property: title
         *
         * FIXME: maybe remove from interface? never actually used.
         */
        'title': GObject.ParamSpec.string('title', 'override', 'override',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        /**
         * Property: page-type
         * Type of page that corresponds to a history item
         *
         * The suggested page types are constants: <ARTICLE_PAGE>, <BACK_COVER>,
         * etc.
         */
        'page-type': GObject.ParamSpec.string('page-type', 'Page Type',
            'The type of page of the history item',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        /**
         * Property: model
         * Content object model representing this page
         *
         * For <ARTICLE_PAGE> pages, a <ArticleObjectModel> of the currently
         * displayed article.
         * For <SECTION_PAGE> pages, a <ContentObjectModel>
         * of the currently displayed set.
         * Null for other pages.
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
         * Property: empty
         *
         * A boolean value that stores whether or not a history item contains a
         * query that returns 0 results.
         */
        'empty': GObject.ParamSpec.boolean('empty', 'Empty',
            'True iff the query returned 0 results',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, false),
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

    equals: function (item) {
        return this.title === item.title &&
            this.page_type === item.page_type &&
            (this.model === null && item.model === null || this.model.ekn_id === item.model.ekn_id) &&
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
