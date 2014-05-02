const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;

const InstanceOfMatcher = imports.InstanceOfMatcher;
const utils = imports.utils;

const MOCK_CONTENT_OBJECT_RESULTS = Endless.getCurrentFileDir() + '/../test-content/content-search-results.jsonld';
const MOCK_ARTICLE_OBJECT_RESULTS = Endless.getCurrentFileDir() + '/../test-content/article-search-results.jsonld';

function parse_object_from_file (filename) {
    var file = Gio.file_new_for_path(filename);
    var data = file.load_contents(null);
    return JSON.parse(data[1]);
};

describe ("Search Results Marshaler", function () {
    
    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
    });

    it ("should throw an error when called on invalid data type", function () {
        let notSearchResults = {
            "@type": "schema:Frobinator",
            "numResults": 1,
            "results": [
                { "@type": "bogus", "synopsis": "dolla dolla bill y'all" }
            ]
        };
        expect(function () {
            let results = EosKnowledge.list_from_search_results(notSearchResults);
        }).toThrow();
    });

    it ("should throw an error on unsupported search results", function () {
        let badObject = { "@type": "ekv:Kitten" };
        let searchResults = {
            "@type": "ekv:SearchResults",
            "numResults": 1,
            "results": [ badObject ]
        };

        expect(function () {
            let list = EosKnowledge.list_from_search_results(searchResults);
        }).toThrow();
    });

    it ("should throw an error when there are too many or not enough results", function () {
        let tooFew = {
            "@type": "ekv:SearchResults",
            "numResults": 1,
            "results": []
        };
        let tooMany = {
            "@type": "ekv:SearchResults",
            "numResults": 1,
            "results": [
                {"@type": "ekv:ContentObject"},
                {"@type": "ekv:ContentObject"}
            ]
        };

        expect(function () {
            let list = new EosKnowledge.ContentObjectModel(tooFew);
        }).toThrow();

        expect(function () {
            let list = new EosKnowledge.ContentObjectModel(tooMany);
        }).toThrow();
    });

    it ("should construct a list of results if the data is properly formatted", function () {
        let mockSearchResults = parse_object_from_file(MOCK_CONTENT_OBJECT_RESULTS);
        let objectList = new EosKnowledge.list_from_search_results(mockSearchResults);

        expect(objectList.length).toBe(mockSearchResults.numResults);
    });

    it ("should construct a list of of objects based on @type", function () {
        let contentObjectResults = parse_object_from_file(MOCK_CONTENT_OBJECT_RESULTS);
        let contentObjectList = new EosKnowledge.list_from_search_results(contentObjectResults);

        // All results in MOCK_CONTENT_OBJECT_RESULTS are of @type ContentObject,
        // so expect that they're constructed as such
        for (let i in contentObjectList) {
            expect(contentObjectList[i]).toBeA(EosKnowledge.ContentObjectModel);
        }

        let articleObjectResults = parse_object_from_file(MOCK_ARTICLE_OBJECT_RESULTS);
        let articleObjectList = new EosKnowledge.list_from_search_results(articleObjectResults);

        // All results in MOCK_ARTICLE_OBJECT_RESULTS are of @type ArticleObject,
        // so expect that they're constructed as such
        for (let i in articleObjectList) {
            expect(articleObjectList[i]).toBeA(EosKnowledge.ArticleObjectModel);
        }
    });
});
