const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Gtk = imports.gi.Gtk;
const InstanceOfMatcher = imports.InstanceOfMatcher;

const utils = imports.tests.utils;
const searchUtils = imports.searchUtils;

const TEST_CONTENT_DIR = utils.get_test_content_srcdir();

describe ('Article Object Model', function () {
    let articleObject;
    let mockArticleData = utils.parse_object_from_path(TEST_CONTENT_DIR + 'greyjoy-article.jsonld');
    let mockMediaDir = '/test';

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        articleObject = new EosKnowledgeSearch.ArticleObjectModel.new_from_json_ld(mockArticleData, mockMediaDir);
    });

    describe ('JSON-LD marshaler', function () {
        it ('should construct from a JSON-LD document', function () {
            expect(articleObject).toBeDefined();
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
            ['wikipedia', 'wikihow', 'wikibooks', 'wikisource'].forEach((current_source) => {
                let article = new EosKnowledgeSearch.ArticleObjectModel({
                    source_uri: 'http://endlessm.com',
                    source: current_source,
                });
                expect(article.original_uri).toEqual(article.source_uri);
            });
        });

        it('sets the source name for wiki articles', function () {
            let article = new EosKnowledgeSearch.ArticleObjectModel({
                source: 'wikipedia',
            });
            expect(article.source_name).toEqual('Wikipedia');

            article = new EosKnowledgeSearch.ArticleObjectModel({
                source: 'wikihow',
            });
            expect(article.source_name).toEqual('wikiHow');

            article = new EosKnowledgeSearch.ArticleObjectModel({
                source: 'wikibooks',
            });
            expect(article.source_name).toEqual('Wikibooks');

            article = new EosKnowledgeSearch.ArticleObjectModel({
                source: 'wikisource',
            });
            expect(article.source_name).toEqual('Wikisource');
        });

        it('corrects the license for wiki articles', function () {
            ['wikipedia', 'wikibooks', 'wikisource'].forEach((source) => {
                let article = new EosKnowledgeSearch.ArticleObjectModel({
                    source: source,
                    license: 'Creative Commons',
                });
                expect(article.license).toEqual('CC-BY-SA 3.0');
            });

            let article = new EosKnowledgeSearch.ArticleObjectModel({
                source: 'wikihow',
                license: 'Creative Commons',
            });
            expect(article.license).toEqual('Owner permission');
        });
    });

    describe('being compatible with EOS 2.4', () => {
        it('should infer ekn-version on legacy articles', () => {
            let article = new EosKnowledgeSearch.ArticleObjectModel();
            expect(article.ekn_version).toBe(1);
        });

        it('should infer content-type on legacy articles', () => {
            let pdfArticle = EosKnowledgeSearch.ArticleObjectModel.new_from_json_ld({
                contentURL: 'blah.pdf',
            }, undefined, 1);
            let htmlArticle = EosKnowledgeSearch.ArticleObjectModel.new_from_json_ld({
                articleBody: '<html>Toy Story 2 was okay.</html>',
            }, undefined, 1);

            expect(pdfArticle.content_type).toBe('application/pdf');
            expect(htmlArticle.content_type).toBe('text/html');
        });

        describe('get_html', () => {
            it('should return undefined for PDF articles', () => {
                let htmlArticle = new EosKnowledgeSearch.ArticleObjectModel({
                    content_type: 'application/pdf',
                });

                expect(htmlArticle.get_html()).not.toBeDefined();
            });

            it('should just return the html property for legacy bundles', () => {
                let htmlArticle = new EosKnowledgeSearch.ArticleObjectModel({
                    html: '<html>Toy Story 2 was okay.</html>',
                    content_type: 'text/html',
                    ekn_version: 1,
                });

                expect(htmlArticle.get_html()).toBe(htmlArticle.html);
            });
        });
    });
});

describe ('Reader App Article Object', function () {
    let readerArticleObject;
    let mockReaderArticleData = utils.parse_object_from_path(TEST_CONTENT_DIR + 'frango-frito.jsonld');
    let mockMediaDir = '/test';

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        readerArticleObject = new EosKnowledgeSearch.ArticleObjectModel.new_from_json_ld(mockReaderArticleData, mockMediaDir);
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
