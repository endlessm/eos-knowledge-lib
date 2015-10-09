const Gtk = imports.gi.Gtk;

const ArticleObjectModel = imports.search.articleObjectModel;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

describe ('Article Object Model', function () {
    let articleObject, jsonld;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        jsonld = {
            '@id': 'ekn:asoiaf/House_Greyjoy',
            'title': 'House Greyjoy',
            'synopsis': 'We Do Not Sow',
            'authors': ['Dalton Greyjoy', 'Dagon Greyjoy'],
            'tableOfContents': [
                {
                    '@id': '_:1',
                    'hasIndex': 0,
                    'hasIndexLabel': '1',
                    'hasLabel': 'History',
                    'hasContent': 'ekn://asoiaf/House_Greyjoy#History'
                },
            ],
        };
        articleObject = new ArticleObjectModel.ArticleObjectModel({}, jsonld);
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

        it('marshals an authors array', function () {
            expect(articleObject.authors).toEqual(jsonld['authors']);
        });

        it('makes a deep copy of the authors array', function () {
            jsonld['authors'].push('Loron Greyjoy');
            expect(articleObject.authors).not.toEqual(jsonld['authors']);
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
    let readerArticleObject, jsonld;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        jsonld = {
            '@id': 'ekn:cooking_magazine/Frango_Frito',
            'title': 'Receita de frango frito',
            'issueNumber': 12,
            'articleNumber': 25,
        };
        readerArticleObject = new ArticleObjectModel.ArticleObjectModel({}, jsonld);
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
