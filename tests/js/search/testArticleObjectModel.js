const Gtk = imports.gi.Gtk;

const ArticleObjectModel = imports.search.articleObjectModel;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const utils = imports.tests.utils;

const TEST_CONTENT_DIR = utils.get_test_content_srcdir();

describe ('Article Object Model', function () {
    let articleObject;
    let mockArticleData = utils.parse_object_from_path(TEST_CONTENT_DIR + 'greyjoy-article.jsonld');

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        articleObject = new ArticleObjectModel.ArticleObjectModel({}, mockArticleData);
    });

    describe ('JSON-LD marshaler', function () {
        it ('should construct from a JSON-LD document', function () {
            expect(articleObject).toBeDefined();
        });

        it ('should inherit properties set by parent class (ContentObjectModel)', function () {
            expect(articleObject.title).toBeDefined();
            expect(articleObject.synopsis).toBeDefined();
            expect(articleObject.resources).toBeDefined();
        });

        it ('should marshal a GtkTreeStore from JSON-LD TreeNodes', function () {
            expect(articleObject.table_of_contents).toBeA(Gtk.TreeStore);
        });
    });

    describe('ekn version 1 compatibility layer', function () {
        it('sets the original URI for wiki articles', function () {
            ['wikipedia', 'wikihow', 'wikibooks', 'wikisource'].forEach((current_source) => {
                let article = new ArticleObjectModel.ArticleObjectModel({
                    ekn_version: 1,
                    source_uri: 'http://endlessm.com',
                    source: current_source,
                });
                expect(article.original_uri).toEqual(article.source_uri);
            });
        });

        it('sets the source name for wiki articles', function () {
            let article = new ArticleObjectModel.ArticleObjectModel({
                source: 'wikipedia',
            });
            expect(article.source_name).toEqual('Wikipedia');

            article = new ArticleObjectModel.ArticleObjectModel({
                source: 'wikihow',
            });
            expect(article.source_name).toEqual('wikiHow');

            article = new ArticleObjectModel.ArticleObjectModel({
                source: 'wikibooks',
            });
            expect(article.source_name).toEqual('Wikibooks');

            article = new ArticleObjectModel.ArticleObjectModel({
                source: 'wikisource',
            });
            expect(article.source_name).toEqual('Wikisource');
        });

        it('corrects the license for wiki articles', function () {
            ['wikipedia', 'wikibooks', 'wikisource'].forEach((source) => {
                let article = new ArticleObjectModel.ArticleObjectModel({
                    ekn_version: 1,
                    source: source,
                    license: 'Creative Commons',
                });
                expect(article.license).toEqual('CC-BY-SA 3.0');
            });

            let article = new ArticleObjectModel.ArticleObjectModel({
                source: 'wikihow',
                license: 'Creative Commons',
            });
            expect(article.license).toEqual('Owner permission');
        });
    });
});

describe ('Reader App Article Object', function () {
    let readerArticleObject;
    let mockReaderArticleData = utils.parse_object_from_path(TEST_CONTENT_DIR + 'frango-frito.jsonld');

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        readerArticleObject = new ArticleObjectModel.ArticleObjectModel({}, mockReaderArticleData);
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
