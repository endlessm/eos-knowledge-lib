const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const ContentObjectModel = imports.search.contentObjectModel;
const QueryObject = imports.search.queryObject;

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
         * The string used in recreating the title of a page.
         */
        'title': GObject.ParamSpec.string('title', 'override', 'override',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
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
         * A <ContentObjectModel> that stores the information used to replicate
         * an article on a page of type 'article'.
         * Contains an object for pages of type 'article' and 'section',
         * otherwise null.
         */
        'model': GObject.ParamSpec.object('model', 'Model',
            'Content object model representing this page',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ContentObjectModel.ContentObjectModel),
        /**
         * Property: query-obj
         *
         * A <QueryObject> of a search or section page request sent to the knowledge engine.
         * It is used to recreate the query and thus display the appropriate information to a user that returns
         * to this item in the history.
         */
        'query-obj': GObject.ParamSpec.object('query-obj', 'Query Object',
            'The QueryObject of the query used in this history item',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, QueryObject.QueryObject),
        /**
         * Property: article-origin-query
         *
         * A <QueryObject> of the search or section query that eventually led to the user reaching this
         * history item. This query is used to replicate the list of titles that were available to a user
         * when they first selected this history item (currently only used in Template B apps).
         */
        'article-origin-query-obj': GObject.ParamSpec.object('article-origin-query-obj', 'Article Origin Query Object',
            'The QueryObject that was used to generate the list of articles from which this object was chosen.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, QueryObject.QueryObject),
        /**
         * Property: article-origin-page
         *
         * A string that stores the title of the article page from which the user naviated to this
         * page.
         */
        'article-origin-page': GObject.ParamSpec.string('article-origin-page', 'Article Origin Page',
            'A string that stores the title of the article page from which the user navigated to this page',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),

        /**
         * Property: empty
         *
         * A boolean value that stores whether or not a history item contains a query that returns 0 results.
         */
        'empty': GObject.ParamSpec.boolean('empty', 'Empty',
            'A boolean value that stores whether or not a history item contains a query that returns 0 results',
            GObject.ParamFlags.READWRITE, false),
    }
});
