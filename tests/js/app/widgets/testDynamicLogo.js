const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();
Utils.register_test_gresource();

const AppUtils = imports.app.utils;
const CssClassMatcher = imports.tests.CssClassMatcher;
const DynamicLogo = imports.app.widgets.dynamicLogo;

Gtk.init(null);

describe('Dynamic Logo', function () {
    let logo;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        spyOn(AppUtils, 'get_desktop_app_info').and.returnValue({
            get_name: () => "Placeholder",
        });

        logo = new DynamicLogo.DynamicLogo({ image_uri: 'resource:///app/assets/logo' });
    });

    it('can be constructed', function () {
        expect(logo).toBeDefined();
    });
});
