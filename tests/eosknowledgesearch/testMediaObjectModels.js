const Endless = imports.gi.Endless;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Gtk = imports.gi.Gtk;
const InstanceOfMatcher = imports.InstanceOfMatcher;

const utils = imports.tests.utils;

const MOCK_IMAGE_PATH = Endless.getCurrentFileDir() + '/../test-content/rick-astley-image.jsonld';
const MOCK_VIDEO_PATH = Endless.getCurrentFileDir() + '/../test-content/never-gonna-give-you-up-video.jsonld';

describe ('Image Object Model', function () {
    let imageObject;
    let mockImageData = utils.parse_object_from_path(MOCK_IMAGE_PATH);

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        imageObject = new EosKnowledgeSearch.ImageObjectModel.new_from_json_ld(mockImageData);
    });

    describe ('type', function () {
        it ('should be an ImageObjectModel', function () {
            expect(imageObject).toBeA(EosKnowledgeSearch.ImageObjectModel);
        });

        it ('should be an MediaObjectModel', function () {
            expect(imageObject).toBeA(EosKnowledgeSearch.MediaObjectModel);
        });
    });

    describe ('JSON-LD marshaler', function () {
        it ('should construct from a JSON-LD document', function () {
            expect(imageObject).toBeDefined();
        });

        it ('should inherit properties set by parent class (MediaObjectModel)', function () {
            expect(imageObject.caption).toBeDefined();
            expect(imageObject.width).toBeDefined();
            expect(imageObject.content_uri).toBeDefined();
            expect(imageObject.height).toBeDefined();
        });
    });
});

describe ('Video Object Model', function () {
    let videoObject;
    let mockVideoData = utils.parse_object_from_path(MOCK_VIDEO_PATH);

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        videoObject = new EosKnowledgeSearch.VideoObjectModel.new_from_json_ld(mockVideoData);
    });

    describe ('type', function () {
        it ('should be an VideoObjectModel', function () {
            expect(videoObject).toBeA(EosKnowledgeSearch.VideoObjectModel);
        });

        it ('should be an MediaObjectModel', function () {
            expect(videoObject).toBeA(EosKnowledgeSearch.MediaObjectModel);
        });
    });

    describe ('JSON-LD marshaler', function () {
        it ('should construct from a JSON-LD document', function () {
            expect(videoObject).toBeDefined();
        });

        it ('should inherit properties set by parent class (MediaObjectModel)', function () {
            expect(videoObject.caption).toBeDefined();
            expect(videoObject.width).toBeDefined();
            expect(videoObject.height).toBeDefined();
            expect(videoObject.duration).toBeDefined();
            expect(videoObject.transcript).toBeDefined();
        });
    });
});
