const Gtk = imports.gi.Gtk;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

const MediaObjectModel = imports.search.mediaObjectModel;
const MediaInfobox = imports.app.mediaInfobox;
const Utils = imports.tests.utils;

Gtk.init(null);

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();
const MOCK_IMAGE_PATH = TEST_CONTENT_DIR + 'rick-astley-image.jsonld';

describe ('Media Infobox', function () {
    let imageObject;
    let mockImageData = Utils.parse_object_from_path(MOCK_IMAGE_PATH);

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        Utils.register_gresource();

        imageObject = new MediaObjectModel.ImageObjectModel.new_from_json_ld(mockImageData);
    });

    it ('should be constructable from a MediaObjectModel', function () {
        let infobox = MediaInfobox.MediaInfobox.new_from_ekn_model(imageObject);        
        expect(infobox.caption).toBe(imageObject.caption);
        expect(infobox.license_text).toBe(imageObject.license);
        expect(infobox.creator_text).toBe(imageObject.copyright_holder);
    });

});
