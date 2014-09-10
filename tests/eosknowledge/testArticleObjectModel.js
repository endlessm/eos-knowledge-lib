const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;
const InstanceOfMatcher = imports.InstanceOfMatcher;

const utils = imports.tests.utils;

const MOCK_ARTICLES_PATH = Endless.getCurrentFileDir() + '/../test-content/';

describe ('Article Object Model', function () {
    let articleObject;
    let mockArticleData = utils.parse_object_from_path(MOCK_ARTICLES_PATH + 'greyjoy-article.jsonld');

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        articleObject = new EosKnowledge.ArticleObjectModel.new_from_json_ld(mockArticleData);
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

        it ('should marhsal its resources like a ContentObject', function () {
            let contentURIs = articleObject.get_resources().map(function (v) {
                return v.content_uri;
            });
            let expectedURIs = mockArticleData.resources.map(function (v) {
                return v.contentURL;
            });
            expect(articleObject.get_resources()[0]).toBeA(EosKnowledge.MediaObjectModel);
            expect(contentURIs).toEqual(expectedURIs);
        });

        it ('should marshal a GtkTreeStore from JSON-LD TreeNodes', function () {
            expect(articleObject.table_of_contents).toBeA(Gtk.TreeStore);
        });
    });
});

describe ('Reader App Article Object', function () {
    let readerArticleObject;
    let mockReaderArticleData = utils.parse_object_from_path(MOCK_ARTICLES_PATH + 'frango-frito.jsonld');

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        readerArticleObject = new EosKnowledge.ArticleObjectModel.new_from_json_ld(mockReaderArticleData);
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
