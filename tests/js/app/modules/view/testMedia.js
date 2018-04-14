const {DModel, Gtk} = imports.gi;

const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Utils = imports.tests.utils;
Utils.register_gresource();

const {Media} = imports.app.modules.view.media;

Gtk.init(null);

describe('View.Media', function () {
    Object.defineProperty(DModel.Image.prototype, 'id', {
        get: function() { return null; }
    });

    it('has labels that understand Pango markup', function () {
        let model = new DModel.Image({
            copyright_holder: '!!!',
            caption: '@@@',
        });

        let view = new Media({
            model: model,
        });
        expect(Gtk.test_find_label(view, '*!!!*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(view, '*@@@*').use_markup).toBeTruthy();
    });

    describe ('Attribution button', function () {
        let view;
        let copyright_holder = '!!!';
        let attribution_button;

        it ('displays license file when license is known', function () {
            let model = new DModel.Image({
                license: 'CC BY 4.0',
                copyright_holder: copyright_holder,
            });

            view = new Media({
                model: model,
            });

            attribution_button = Gtk.test_find_label(view, '*!!!*').get_parent();
            expect(attribution_button.sensitive).toBe(true);
        });

        it ('does not display license file when license is unknown', function () {
            let model = new DModel.Image({
                license: 'foobar',
                copyright_holder: copyright_holder,
            });

            view = new Media({
                model: model,
            });

            attribution_button = Gtk.test_find_label(view, '*!!!*').get_parent();
            expect(attribution_button.sensitive).toBe(false);
        });
    });
});
