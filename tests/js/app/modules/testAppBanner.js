const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const AppBanner = imports.app.modules.appBanner;

Gtk.init(null);

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

describe('App banner module', function () {
    let app_banner;
    let pig_uri = Gio.File.new_for_path(TEST_CONTENT_DIR).get_child('pig1.jpg').get_uri();

    beforeEach(function () {
        app_banner = new AppBanner.AppBanner({
            image_uri: pig_uri,
        });
    });

    it('can be constructed', function () {});
});
