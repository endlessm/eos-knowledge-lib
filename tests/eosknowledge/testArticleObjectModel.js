const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;
const InstanceOfMatcher = imports.InstanceOfMatcher;

const utils = imports.utils;

EosKnowledge.init();

const MOCK_ARTICLE_PATH = Endless.getCurrentFileDir() + '/../test-content/greyjoy-article.jsonld';

describe ('Article Object Model', function () {
    let articleObject;
    let mockArticleData = utils.parse_object_from_path(MOCK_ARTICLE_PATH);

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
        });

        it ('should marshal a GtkTreeStore from JSON-LD TreeNodes', function () {
            expect(articleObject.table_of_contents).toBeA(Gtk.TreeStore);
        });
    });
});
