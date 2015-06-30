const Gtk = imports.gi.Gtk;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

const MediaObjectModel = imports.search.mediaObjectModel;
const MediaCard = imports.app.mediaCard;
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
            get_content_stream: () => null,
            content_type: 'image/jpeg',
        });
    });

    it ('should be constructable from a MediaObjectModel', function () {
        let media_card = MediaCard.MediaCard.new_from_ekn_model(imageObject);
        expect(media_card.caption).toBe(imageObject.caption);
        expect(media_card.license_text).toBe(imageObject.license);
        expect(media_card.creator_text).toBe(imageObject.copyright_holder);
    });

    it ('hides separator when caption or attribution not visible', function () {
        let noCaption = new MediaObjectModel.ImageObjectModel({
            license: "bar",
            copyright_holder: "baz",
            get_content_stream: () => null,
            content_type: 'image/jpeg',
        });

        let noAttribution = new MediaObjectModel.ImageObjectModel({
            caption: "foo",
            get_content_stream: () => null,
            content_type: 'image/jpeg',
        });

        let media_card = MediaCard.MediaCard.new_from_ekn_model(imageObject);
        expect(media_card._separator.visible).toBe(true);
        media_card = MediaCard.MediaCard.new_from_ekn_model(noCaption);
        expect(media_card._separator.visible).toBe(false);
        media_card = MediaCard.MediaCard.new_from_ekn_model(noAttribution);
        expect(media_card._separator.visible).toBe(false);
    });
});
