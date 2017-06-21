const Eknc = imports.gi.EosKnowledgeContent;

const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

describe('Dictionary Object Model', function() {
    let dictionaryObject, jsonld;

    beforeEach(function() {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        jsonld = {
            '@id': 'ekn:word/Entreaty',
            'word': 'entreaty',
            'definition': 'An earnest request or petition; a plea.',
            'partOfSpeech': 'noun',
            'title': 'June 23rd',
        };
        dictionaryObject = Eknc.DictionaryObjectModel.new_from_json(jsonld);
    });

    describe('type', function() {
        it('should be a ContentObjectModel', function() {
            expect(dictionaryObject).toBeA(Eknc.ContentObjectModel);
        });

        it('should be a DictionaryObjectModel', function() {
            expect(dictionaryObject).toBeA(Eknc.DictionaryObjectModel);
        });
    });

    describe('JSON-LD marshaler', function() {
        it('should construct from a JSON-LD document', function() {
            expect(dictionaryObject).toBeDefined();
        });

        it('should marshal properties', function() {
            expect(dictionaryObject.word).toBe('entreaty');
            expect(dictionaryObject.definition).toBe('An earnest request or petition; a plea.');
            expect(dictionaryObject.part-of-speech).toBe('noun');
        });

        it('should inherit properties set by parent class (ContentObjectModel)', function() {
            expect(dictionaryObject.title).toBe('June 23rd');
        });
    });
});
