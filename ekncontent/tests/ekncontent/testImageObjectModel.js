const Eknc = imports.gi.EosKnowledgeContent;

const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

const MOCK_IMAGE_DATA = {
    '@id': 'ekn://rick/astley',
    'title': 'Rick Astley: The Man, The Myth, The Legend',
    'caption': 'Great musician, or greatest?',
    'height': '666',
    'width': '666',
};

describe('Image Object Model', function () {
    let imageObject;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        imageObject = Eknc.ImageObjectModel.new_from_json(MOCK_IMAGE_DATA);
    });

    describe('type', function () {
        it('should be an MediaObjectModel', function () {
            expect(imageObject).toBeA(Eknc.MediaObjectModel);
        });

        it('should be an ImageObjectModel', function () {
            expect(imageObject).toBeA(Eknc.ImageObjectModel);
        });
    });

    describe('JSON-LD marshaler', function () {
        it('should construct from a JSON-LD document', function () {
            expect(imageObject).toBeDefined();
        });

        it('should inherit properties set by parent class (MediaObjectModel)', function () {
            expect(imageObject.caption).toBe('Great musician, or greatest?');
            expect(imageObject.width).toBe(666);
            expect(imageObject.height).toBe(666);
        });
    });
});
