const EosKnowledge = imports.gi.EosKnowledge;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

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
    Implements: [ EosKnowledge.HistoryItemModel ],
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
         * Property: article-model
         *
         * An <ArticleObjectModel> that stores the information used to replicate an article
         * on a page of type 'article'.
         */
        'article-model': GObject.ParamSpec.object('article-model', 'Article model',
            'The article object model handled by this widget. Only not null for pages of type \'article\'',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, EosKnowledgeSearch.ArticleObjectModel),
        /**
         * Property: query-obj
         *
         * A <QueryObject> of a search or section page request sent to the knowledge engine.
         * It is used to recreate the query and thus display the appropriate information to a user that returns
         * to this item in the history.
         */
        'query-obj': GObject.ParamSpec.object('query-obj', 'Query Object',
            'The QueryObject of the query used in this history item',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, EosKnowledgeSearch.QueryObject),
        /**
         * Property: article-origin-query
         *
         * A <QueryObject> of the search or section query that eventually led to the user reaching this
         * history item. This query is used to replicate the list of titles that were available to a user
         * when they first selected this history item (currently only used in Template B apps).
         */
        'article-origin-query-obj': GObject.ParamSpec.object('article-origin-query-obj', 'Article Origin Query Object',
            'The QueryObject that was used to generate the list of articles from which this object was chosen.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, EosKnowledgeSearch.QueryObject),
        /**
         * Property: article-origin-page
         *
         * A string that stores the title of the article page from which the user naviated to this
         * page.
         */
        'article-origin-page': GObject.ParamSpec.string('article-origin-page', 'Article Origin Page',
            'A string that stores the title of the article page from which the user navigated to this page',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    }
});
