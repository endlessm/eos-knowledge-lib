const Eknc = imports.gi.EosKnowledgeContent;
const Json = imports.gi.Json;

const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

describe ('Article Object Model', function () {
    let articleObject, jsonld;
    let json_node;

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
        json_node = Json.from_string(JSON.stringify(jsonld));
        articleObject = Eknc.ArticleObjectModel.new_from_json_node(json_node);
    });

    describe ('JSON-LD marshaler', function () {
        it ('should inherit properties set by parent class (ContentObjectModel)', function () {
            expect(articleObject.title).toBeDefined();
            expect(articleObject.synopsis).toBeDefined();
            expect(articleObject.resources).toBeDefined();
        });

        it ('should read in a table of contents', function () {
            expect(articleObject.table_of_contents.deep_unpack()[0].hasLabel.deep_unpack()).toBe('History');
        });

        it('marshals an authors array', function () {
            expect(articleObject.authors.deep_unpack()).toEqual(jsonld['authors']);
        });

        it('makes a deep copy of the authors array', function () {
            jsonld['authors'].push('Loron Greyjoy');
            expect(articleObject.authors).not.toEqual(jsonld['authors']);
        });
    });
});
