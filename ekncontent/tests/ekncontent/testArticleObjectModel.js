const Eknc = imports.gi.EosKnowledgeContent;

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
            'temporalCoverage': [new Date(2016, 1, 1).toISOString()],
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
        articleObject = Eknc.ArticleObjectModel.new_from_json(jsonld);
    });

    describe ('JSON-LD marshaler', function () {
        it ('should inherit properties set by parent class (ContentObjectModel)', function () {
            expect(articleObject.title).toBeDefined();
            expect(articleObject.synopsis).toBeDefined();
            expect(articleObject.resources).toBeDefined();
        });

        it ('should read in a table of contents', function () {
            expect(articleObject.table_of_contents[0].hasLabel).toBe('History');
        });

        it('marshals an authors array', function () {
            expect(articleObject.authors).toEqual(jsonld['authors']);
        });

        it('marshals an temporalCoverage array', function () {
            expect(articleObject.temporal_coverage).toEqual(jsonld['temporalCoverage']);
        });

        it('makes a deep copy of the authors array', function () {
            jsonld['authors'].push('Loron Greyjoy');
            expect(articleObject.authors).not.toEqual(jsonld['authors']);
        });
    });
});
