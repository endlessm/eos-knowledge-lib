const Eknc = imports.gi.EosKnowledgeContent;

const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

const MOCK_VIDEO_DATA = {
    '@id': 'ekn://rick/never',
    'title': 'Never Gonna Give You Up (Never Gonna Let You Down)',
    'caption': 'If this song was sushi, it would be a Rick Roll',
    'transcript': 'We\'re no strangers to love, etc etc etc',
    'duration': 'P666S',
    'height': '666',
    'width': '666',
    'poster-uri': 'ekn://rick/poster',
};

describe('Video Object Model', function () {
    let videoObject;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        videoObject = Eknc.VideoObjectModel.new_from_json(MOCK_VIDEO_DATA);
    });

    describe('type', function () {
        it('should be an VideoObjectModel', function () {
            expect(videoObject).toBeA(Eknc.VideoObjectModel);
        });

        it('should be an MediaObjectModel', function () {
            expect(videoObject).toBeA(Eknc.MediaObjectModel);
        });
    });

    describe('JSON-LD marshaler', function () {
        it('should construct from a JSON-LD document', function () {
            expect(videoObject).toBeDefined();
        });

        it('should inherit properties set by parent class (MediaObjectModel)', function () {
            expect(videoObject.caption).toBeDefined();
            expect(videoObject.width).toBeDefined();
            expect(videoObject.height).toBeDefined();
            expect(videoObject.duration).toBeDefined();
            expect(videoObject.transcript).toBeDefined();
            expect(videoObject.poster_uri).toBeDefined();
        });
    });
});
