const Gtk = imports.gi.Gtk;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

const Utils = imports.tests.utils;
Utils.register_gresource();

const MediaObjectModel = imports.search.mediaObjectModel;
const MediaCard = imports.app.mediaCard;

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

        let media_card = new MediaCard.MediaCard({
            model: imageObject,
        });
        expect(media_card._separator.visible).toBe(true);
        media_card = new MediaCard.MediaCard({
            model: noCaption,
        });
        expect(media_card._separator.visible).toBe(false);
        media_card = new MediaCard.MediaCard({
            model: noAttribution,
        });
        expect(media_card._separator.visible).toBe(false);
    });
});
