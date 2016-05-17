const Gtk = imports.gi.Gtk;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

const CssClassMatcher = imports.tests.CssClassMatcher;
const Utils = imports.tests.utils;
Utils.register_gresource();

const MediaObjectModel = imports.search.mediaObjectModel;
const Media = imports.app.modules.card.media;

Gtk.init(null);

describe ('Media Card', function () {
    let imageObject;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        imageObject = new MediaObjectModel.ImageObjectModel({
            caption: 'foo',
            license: 'bar',
            copyright_holder: 'baz',
            get_content_stream: () => null,
            content_type: 'image/jpeg',
        });
    });

    it ('hides separator when caption or attribution not visible', function () {
        let noCaption = new MediaObjectModel.ImageObjectModel({
            license: 'bar',
            copyright_holder: 'baz',
            get_content_stream: () => null,
            content_type: 'image/jpeg',
        });

        let noAttribution = new MediaObjectModel.ImageObjectModel({
            caption: 'foo',
            get_content_stream: () => null,
            content_type: 'image/jpeg',
        });

        let media_card = new Media.Media({
            model: imageObject,
        });
        expect(media_card._separator.visible).toBe(true);
        media_card = new Media.Media({
            model: noCaption,
        });
        expect(media_card._separator.visible).toBe(false);
        media_card = new Media.Media({
            model: noAttribution,
        });
        expect(media_card._separator.visible).toBe(false);
    });

    it('has labels that understand Pango markup', function () {
        let card = new Media.Media({
            model: new MediaObjectModel.ImageObjectModel({
                copyright_holder: '!!!',
                caption: '@@@',
                get_content_stream: () => null,
            }),
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*@@@*').use_markup).toBeTruthy();
    });

    describe ('Attribution button', function () {
        let card;
        let copyright_holder = '!!!';
        let attribution_button;

        it ('displays license file when license is known', function () {
            card = new Media.Media({
                model: new MediaObjectModel.ImageObjectModel({
                    license: 'CC BY 4.0',
                    copyright_holder: copyright_holder,
                    get_content_stream: () => null,
                }),
            });

            attribution_button = Gtk.test_find_label(card, '*!!!*').get_parent();
            expect(attribution_button.sensitive).toBe(true);
        });

        it ('does not display license file when license is unknown', function () {
            card = new Media.Media({
                model: new MediaObjectModel.ImageObjectModel({
                    license: 'foobar',
                    copyright_holder: copyright_holder,
                    get_content_stream: () => null,
                }),
            });

            attribution_button = Gtk.test_find_label(card, '*!!!*').get_parent();
            expect(attribution_button.sensitive).toBe(false);
        });
    });
});
