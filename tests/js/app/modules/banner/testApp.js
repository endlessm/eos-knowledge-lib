// Copyright 2015 Endless Mobile, Inc.

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const App = imports.app.modules.banner.app;
const AppUtils = imports.app.utils;
const CssClassMatcher = imports.tests.CssClassMatcher;

Gtk.init(null);

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

describe('App banner module', function () {
    let app_banner;
    let pig_uri = Gio.File.new_for_path(TEST_CONTENT_DIR).get_child('pig1.jpg').get_uri();

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        spyOn(AppUtils, 'get_desktop_app_info').and.returnValue({
            get_description: () => "A Cute Pig",
        });
        app_banner = new App.App({
            image_uri: pig_uri,
            show_subtitle: true,
        });
    });

    it('can be constructed', function () {});

    it('displays the subtitle if show subtitle true', function () {
        let subtitle_widget = Gtk.test_find_label(app_banner, 'A Cute Pig');
        expect(subtitle_widget).not.toBeNull();
    });

    it('does not displays the subtitle if show subtitle false', function () {
        app_banner = new App.App({
            image_uri: pig_uri,
        });
        let subtitle_widget = Gtk.test_find_label(app_banner, 'A Cute Pig');
        expect(subtitle_widget).toBeNull();
    });

    it('has the app-banner CSS class', function () {
        expect(app_banner).toHaveCssClass('app-banner');
    });

    it('has a subtitle with the subtitle CSS class', function () {
        let subtitle_widget = Gtk.test_find_label(app_banner, 'A Cute Pig');
        expect(subtitle_widget).toHaveCssClass('subtitle');
    });

    it('justifies the subtitle appropriately to its alignment', function () {
        Gtk.Widget.set_default_direction(Gtk.TextDirection.LTR);
        let expected_justifications = {};
        expected_justifications[Gtk.Align.START] = Gtk.Justification.LEFT;
        expected_justifications[Gtk.Align.END] = Gtk.Justification.RIGHT;
        expected_justifications[Gtk.Align.CENTER] = Gtk.Justification.CENTER;
        expected_justifications[Gtk.Align.FILL] = Gtk.Justification.CENTER;

        for (let align in expected_justifications) {
            let app_banner = new App.App({
                image_uri: pig_uri,
                show_subtitle: true,
                halign: align,
            });
            let subtitle_widget = Gtk.test_find_label(app_banner, 'A Cute Pig');
            expect(subtitle_widget.justify).toBe(expected_justifications[align]);
        }
    });
});
