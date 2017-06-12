const Eknc = imports.gi.EosKnowledgeContent;
const Gtk = imports.gi.Gtk;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;

const CssClassMatcher = imports.tests.CssClassMatcher;
const Utils = imports.tests.utils;
Utils.register_gresource();

const Media = imports.app.modules.card.media;

Gtk.init(null);

describe ('Card.Media', function () {

    Object.defineProperty(Eknc.ImageObjectModel.prototype, 'ekn_id', {
        get: function() { return null; }
    });

    it('has labels that understand Pango markup', function () {
        let model = Eknc.ImageObjectModel.new_from_props({
            copyright_holder: '!!!',
            caption: '@@@',
        });

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

            card = new Media.Media({
                model: model,
            });

            attribution_button = Gtk.test_find_label(card, '*!!!*').get_parent();
            expect(attribution_button.sensitive).toBe(false);
        });
    });
});
