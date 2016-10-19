const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();
Utils.register_test_gresource();

const AppUtils = imports.app.utils;
const DynamicLogo = imports.app.widgets.dynamicLogo;

Gtk.init(null);

describe('Dynamic Logo', function () {
    let logo;

    beforeEach(function () {
        logo = new DynamicLogo.DynamicLogo({
            image_uri: 'resource:///app/assets/logo',
            text: 'apptext',
        });
    });

    it('can be constructed', function () {
        expect(logo).toBeDefined();
    });
});
