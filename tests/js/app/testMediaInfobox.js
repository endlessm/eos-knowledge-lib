const Gtk = imports.gi.Gtk;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

const MediaObjectModel = imports.search.mediaObjectModel;
const MediaInfobox = imports.app.mediaInfobox;
const Utils = imports.tests.utils;

Gtk.init(null);

describe ('Media Infobox', function () {
    let imageObject;

    beforeEach(function () {
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        Utils.register_gresource();

        imageObject = new MediaObjectModel.ImageObjectModel({
            caption: "foo",
            license: "bar",
            copyright_holder: "baz",
        });
    });

    it ('should be constructable from a MediaObjectModel', function () {
        let infobox = MediaInfobox.MediaInfobox.new_from_ekn_model(imageObject);        
        expect(infobox.caption).toBe(imageObject.caption);
        expect(infobox.license_text).toBe(imageObject.license);
        expect(infobox.creator_text).toBe(imageObject.copyright_holder);
    });

});
