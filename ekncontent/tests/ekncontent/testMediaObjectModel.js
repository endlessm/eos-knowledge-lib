const Eknc = imports.gi.EosKnowledgeContent;

const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

const MOCK_MEDIA_DATA = {
    '@id': 'ekn://rick/astley',
    'title': 'Rick Astley: The Man, The Myth, The Legend',
    'caption': 'Great musician, or greatest?',
    'height': '666',
    'width': '666',
    'parent': 'ekn://paul/banks',
};

describe('Media Object Model', function () {
    let imageObject;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        imageObject = Eknc.MediaObjectModel.new_from_json(MOCK_MEDIA_DATA);
    });

    describe('type', function () {
        it('should be a ContentObjectModel', function () {
            expect(imageObject).toBeA(Eknc.ContentObjectModel);
        });

        it('should be a MediaObjectModel', function () {
            expect(imageObject).toBeA(Eknc.MediaObjectModel);
        });
    });

    describe('JSON-LD marshaler', function () {
        it('should construct from a JSON-LD document', function () {
            expect(imageObject).toBeDefined();
        });

        it('should marshal properties', function () {
            expect(imageObject.caption).toBe('Great musician, or greatest?');
            expect(imageObject.width).toBe(666);
            expect(imageObject.height).toBe(666);
            expect(imageObject.parent_uri).toBe(MOCK_MEDIA_DATA.parent);
        });

        it('should inherit properties set by parent class (ContentObjectModel)', function () {
            expect(imageObject.title).toBe('Rick Astley: The Man, The Myth, The Legend');
        });
    });
});
