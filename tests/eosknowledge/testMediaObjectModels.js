const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
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
        imageObject = new EosKnowledge.ImageObjectModel.new_from_json_ld(mockImageData);
    });

    describe ('type', function () {
        it ('should be an ImageObjectModel', function () {
            expect(imageObject).toBeA(EosKnowledge.ImageObjectModel);
        });

        it ('should be an MediaObjectModel', function () {
            expect(imageObject).toBeA(EosKnowledge.MediaObjectModel);
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
        videoObject = new EosKnowledge.VideoObjectModel.new_from_json_ld(mockVideoData);
    });

    describe ('type', function () {
        it ('should be an VideoObjectModel', function () {
            expect(videoObject).toBeA(EosKnowledge.VideoObjectModel);
        });

        it ('should be an MediaObjectModel', function () {
            expect(videoObject).toBeA(EosKnowledge.MediaObjectModel);
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
