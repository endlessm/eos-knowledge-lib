// Copyright 2015 Endless Mobile, Inc.

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();
Utils.register_test_gresource();

const App = imports.framework.modules.banner.app;
const AppUtils = imports.framework.utils;
const CssClassMatcher = imports.tests.CssClassMatcher;

Gtk.init(null);

describe('Banner.App', function () {
    let app_banner;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        spyOn(AppUtils, 'get_desktop_app_info').and.returnValue({
            get_description: () => "A Cute Pig",
        });
        app_banner = new App.App({
            show_subtitle: true,
        });
    });

    it('displays the subtitle if show subtitle true', function () {
        let subtitle_widget = Gtk.test_find_label(app_banner, 'A Cute Pig');
        expect(subtitle_widget).not.toBeNull();
    });

    it('does not displays the subtitle if show subtitle false', function () {
        app_banner = new App.App();
        let subtitle_widget = Gtk.test_find_label(app_banner, 'A Cute Pig');
        expect(subtitle_widget).toBeNull();
    });

    it('has a subtitle with the subtitle CSS class', function () {
        let subtitle_widget = Gtk.test_find_label(app_banner, 'A Cute Pig');
        expect(subtitle_widget).toHaveCssClass('BannerApp__subtitle');
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
                show_subtitle: true,
                halign: align,
            });
            let subtitle_widget = Gtk.test_find_label(app_banner, 'A Cute Pig');
            expect(subtitle_widget.justify).toBe(expected_justifications[align]);
        }
    });
});
