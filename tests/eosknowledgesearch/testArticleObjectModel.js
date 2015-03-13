const Endless = imports.gi.Endless;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Gtk = imports.gi.Gtk;
const InstanceOfMatcher = imports.InstanceOfMatcher;

const utils = imports.tests.utils;

const MOCK_ARTICLES_PATH = Endless.getCurrentFileDir() + '/../test-content/';

describe ('Article Object Model', function () {
    let articleObject;
    let mockArticleData = utils.parse_object_from_path(MOCK_ARTICLES_PATH + 'greyjoy-article.jsonld');
    let mockMediaDir = '/test';

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        articleObject = new EosKnowledgeSearch.ArticleObjectModel.new_from_json_ld(mockArticleData, mockMediaDir);
    });

    describe ('JSON-LD marshaler', function () {
        it ('should construct from a JSON-LD document', function () {
            expect(articleObject).toBeDefined();
        });

        it ('sets its html-source property from the source uri', function () {
            expect(articleObject.html_source).toBe('wikipedia');
        });

        it ('should inherit properties set by parent class (ContentObjectModel)', function () {
            expect(articleObject.title).toBeDefined();
            expect(articleObject.synopsis).toBeDefined();
            expect(articleObject.get_resources()).toBeDefined();
        });

        it ('should marshal a GtkTreeStore from JSON-LD TreeNodes', function () {
            expect(articleObject.table_of_contents).toBeA(Gtk.TreeStore);
        });
    });

    describe('being compatible with EOS 2.2', function () {
        it('sets the original URI for wiki articles', function () {
            ['wikipedia', 'wikihow', 'wikibooks', 'wikisource'].forEach((source) => {
                let article = new EosKnowledgeSearch.ArticleObjectModel({
                    source_uri: 'http://endlessm.com',
                    html_source: source,
                });
                expect(article.original_uri).toEqual(article.source_uri);
            });
        });

        it('sets the source name for wiki articles', function () {
            let article = new EosKnowledgeSearch.ArticleObjectModel({
                html_source: 'wikipedia',
            });
            expect(article.source_name).toEqual('Wikipedia');

            article = new EosKnowledgeSearch.ArticleObjectModel({
                html_source: 'wikihow',
            });
            expect(article.source_name).toEqual('wikiHow');

            article = new EosKnowledgeSearch.ArticleObjectModel({
                html_source: 'wikibooks',
            });
            expect(article.source_name).toEqual('Wikibooks');

            article = new EosKnowledgeSearch.ArticleObjectModel({
                html_source: 'wikisource',
            });
            expect(article.source_name).toEqual('Wikisource');
        });

        it('corrects the license for wiki articles', function () {
            ['wikipedia', 'wikibooks', 'wikisource'].forEach((source) => {
                let article = new EosKnowledgeSearch.ArticleObjectModel({
                    html_source: source,
                    license: 'Creative Commons',
                });
                expect(article.license).toEqual('CC-BY-SA 3.0');
            });

            let article = new EosKnowledgeSearch.ArticleObjectModel({
                html_source: 'wikihow',
                license: 'Creative Commons',
            });
            expect(article.license).toEqual('Owner permission');
        });
    });
});

describe ('Reader App Article Object', function () {
    let readerArticleObject;
    let mockReaderArticleData = utils.parse_object_from_path(MOCK_ARTICLES_PATH + 'frango-frito.jsonld');
    let mockMediaDir = '/test';

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        readerArticleObject = new EosKnowledgeSearch.ArticleObjectModel.new_from_json_ld(mockReaderArticleData, mockMediaDir);
    });

    it ('sets its html-source property from the source uri', function () {
        expect(readerArticleObject.html_source).toBe('embedly');
    });

    it ('should present the properties inherent to the Reader App', function () {
        expect(readerArticleObject.issue_number).toBeDefined();
        expect(readerArticleObject.article_number).toBeDefined();
    });

    it ('should properly parse properties inherent to the Reader App', function () {
        expect(readerArticleObject.issue_number).toEqual(jasmine.any(Number));
        expect(readerArticleObject.issue_number).toBeGreaterThan(-1);

        expect(readerArticleObject.article_number).toEqual(jasmine.any(Number));
        expect(readerArticleObject.article_number).toBeGreaterThan(-1);
    });
});
