const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;
const InstanceOfMatcher = imports.InstanceOfMatcher;

const utils = imports.tests.utils;

const MOCK_IMAGE_PATH = Endless.getCurrentFileDir() + '/../test-content/rick-astley-image.jsonld';

describe ('Media Infobox', function () {
    let imageObject;
    let mockImageData = utils.parse_object_from_path(MOCK_IMAGE_PATH);

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        imageObject = new EosKnowledge.ImageObjectModel.new_from_json_ld(mockImageData);
        
    });

    it ('should be constructable from a MediaObjectModel', function () {
        let infobox = EosKnowledge.MediaInfobox.new_from_ekn_model(imageObject);        
        expect(infobox.caption).toBe(imageObject.caption);
        expect(infobox.license_text).toBe(imageObject.license);
        expect(infobox.creator_text).toBe(imageObject.copyright_holder);
    });

});
