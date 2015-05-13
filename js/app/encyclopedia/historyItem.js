const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const ArticleObjectModel = imports.search.articleObjectModel;

const HistoryItemType = {
    ARTICLE: 0,
    SEARCH_RESULTS: 1,
    MAXVAL: 1
};

const HistoryItem = new Lang.Class({
    Name: 'HistoryItem',
    GTypeName: 'EncyclopediaHistoryItem',
    Extends: GObject.Object,
    Implements: [ EosKnowledgePrivate.HistoryItemModel ],
    Properties: {
        'title': GObject.ParamSpec.string('title', 'Override', 'Override',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        'type': GObject.ParamSpec.uint('type', 'Type',
            'Type of history item: article, search result, etc.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, HistoryItemType.MAXVAL, HistoryItemType.ARTICLE),
        'article': GObject.ParamSpec.object('article', 'Article',
            'An ArticleObjectModel',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ArticleObjectModel.ArticleObjectModel),
        'query-string': GObject.ParamSpec.string('query-string', 'Query string',
            'The query string used to create this page',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
    },
});
