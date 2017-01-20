const Eknc = imports.gi.EosKnowledgeContent;

const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

const MOCK_VIDEO_DATA = {
    '@id': 'ekn://rick/never',
    'title': 'Never Gonna Give You Up (Never Gonna Let You Down)',
    'caption': 'If this song was sushi, it would be a Rick Roll',
    'transcript': 'We\'re no strangers to love, etc etc etc',
    'duration': '666',
    'height': '666',
    'width': '666',
    'poster': 'ekn://rick/poster',
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

        it('should marshal properties', function () {
            expect(videoObject.duration).toBe(666);
            expect(videoObject.transcript).toBe('We\'re no strangers to love, etc etc etc');
            expect(videoObject.poster_uri).toBe('ekn://rick/poster');
        });

        it('should inherit properties set by parent class (MediaObjectModel)', function () {
            expect(videoObject.caption).toBe('If this song was sushi, it would be a Rick Roll');
            expect(videoObject.width).toBe(666);
            expect(videoObject.height).toBe(666);
        });
    });
});
