// Copyright 2015 Endless Mobile, Inc.

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const AppBanner = imports.app.modules.appBanner;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

describe('App banner module', function () {
    let app_banner;
    let pig_uri = Gio.File.new_for_path(TEST_CONTENT_DIR).get_child('pig1.jpg').get_uri();

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        app_banner = new AppBanner.AppBanner({
            image_uri: pig_uri,
            subtitle: 'A Cute Pig',
        });
    });

    it('can be constructed', function () {});

    it('displays the subtitle', function () {
        let subtitle_widget = Gtk.test_find_label(app_banner, 'A Cute Pig');
        expect(subtitle_widget).not.toBeNull();
    });

    it('has the app-banner CSS class', function () {
        expect(app_banner).toHaveCssClass(StyleClasses.APP_BANNER);
    });

    it('has a subtitle with the subtitle CSS class', function () {
        let subtitle_widget = Gtk.test_find_label(app_banner, 'A Cute Pig');
        expect(subtitle_widget).toHaveCssClass(StyleClasses.SUBTITLE);
    });
});
