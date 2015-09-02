const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

const CssClassMatcher = imports.tests.CssClassMatcher;
const Utils = imports.tests.utils;
Utils.register_gresource();

const MediaObjectModel = imports.search.mediaObjectModel;
const MediaCard = imports.app.modules.mediaCard;

Gtk.init(null);

describe ('Media Infobox', function () {
    let imageObject;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        Utils.register_gresource();

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

    it('has labels that understand Pango markup', function () {
        let card = new MediaCard.MediaCard({
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
        let license_shortname;
        let copyright_holder = 'Bruce Lee';
        let attribution;
        let attribution_button;

        function get_attribution_string (license_shortname, copyright_holder) {
            let license_description = Endless.get_license_display_name(license_shortname);
            return (license_description + ' - ' + copyright_holder).toUpperCase();
        }

        it ('displays license file when license is known', function () {
            license_shortname = 'CC BY 4.0';

            card = new MediaCard.MediaCard({
                model: new MediaObjectModel.ImageObjectModel({
                    license: license_shortname,
                    copyright_holder: copyright_holder,
                    get_content_stream: () => null,
                }),
            });

            attribution = get_attribution_string(license_shortname, copyright_holder);
            attribution_button = Gtk.test_find_label(card, attribution).get_parent();
            expect(attribution_button.sensitive).toBe(true);
        });

        it ('does not display license file when license is unknown', function () {
            license_shortname = 'Bogus License';

            card = new MediaCard.MediaCard({
                model: new MediaObjectModel.ImageObjectModel({
                    license: license_shortname,
                    copyright_holder: copyright_holder,
                    get_content_stream: () => null,
                }),
            });

            attribution = get_attribution_string(license_shortname, copyright_holder);
            attribution_button = Gtk.test_find_label(card, attribution).get_parent();
            expect(attribution_button.sensitive).toBe(false);
        });
    });
});
