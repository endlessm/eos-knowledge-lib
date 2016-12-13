const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

const CssClassMatcher = imports.tests.CssClassMatcher;
const Utils = imports.tests.utils;
Utils.register_gresource();

const Media = imports.app.modules.card.media;

Gtk.init(null);

describe ('Card.Media', function () {
    let imageObject;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        imageObject = Eknc.ImageObjectModel.new_from_props({
            caption: 'foo',
            license: 'bar',
            copyright_holder: 'baz',
            content_type: 'image/jpeg',
        });
        imageObject.get_content_stream = () => null;
    });

    it ('hides separator when caption or attribution not visible', function () {
        let noCaption = Eknc.ImageObjectModel.new_from_props({
            license: 'bar',
            copyright_holder: 'baz',
            content_type: 'image/jpeg',
        });
        noCaption.get_content_stream = () => null;

        let noAttribution = Eknc.ImageObjectModel.new_from_props({
            caption: 'foo',
            content_type: 'image/jpeg',
        });
        noAttribution.get_content_stream = () => null;

        let media_card = new Media.Media({
            model: imageObject,
        });
        media_card.get_content_stream = () => null;
        expect(media_card._separator.visible).toBe(true);
        media_card = new Media.Media({
            model: noCaption,
        });
        media_card.get_content_stream = () => null;
        expect(media_card._separator.visible).toBe(false);
        media_card = new Media.Media({
            model: noAttribution,
        });
        media_card.get_content_stream = () => null;
        expect(media_card._separator.visible).toBe(false);
    });

    it('has labels that understand Pango markup', function () {
        let model = Eknc.ImageObjectModel.new_from_props({
            copyright_holder: '!!!',
            caption: '@@@',
        });
        model.get_content_stream = () => null;
        let card = new Media.Media({
            model: model,
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*@@@*').use_markup).toBeTruthy();
    });

    describe ('Attribution button', function () {
        let card;
        let copyright_holder = '!!!';
        let attribution_button;

        it ('displays license file when license is known', function () {
            let model = Eknc.ImageObjectModel.new_from_props({
                license: 'CC BY 4.0',
                copyright_holder: copyright_holder,
            });
            model.get_content_stream = () => null;

            card = new Media.Media({
                model: model,
            });

            attribution_button = Gtk.test_find_label(card, '*!!!*').get_parent();
            expect(attribution_button.sensitive).toBe(true);
        });

        it ('does not display license file when license is unknown', function () {
            let model = Eknc.ImageObjectModel.new_from_props({
                license: 'foobar',
                copyright_holder: copyright_holder,
            });
            model.get_content_stream = () => null;

            card = new Media.Media({
                model: model,
            });

            attribution_button = Gtk.test_find_label(card, '*!!!*').get_parent();
            expect(attribution_button.sensitive).toBe(false);
        });
    });
});
