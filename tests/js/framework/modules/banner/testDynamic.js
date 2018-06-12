// Copyright 2016 Endless Mobile, Inc.

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();
Utils.register_test_gresource();

const Dynamic = imports.framework.modules.banner.dynamic;
const AppUtils = imports.framework.utils;
const CssClassMatcher = imports.tests.CssClassMatcher;

Gtk.init(null);

describe('Banner.Dynamic', function () {
    let dynamic_banner;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        spyOn(AppUtils, 'get_desktop_app_info').and.returnValue({
            get_name: () => "Pig",
            get_description: () => "A Cute Pig",
        });
        dynamic_banner = new Dynamic.Dynamic({
            show_subtitle: true,
        });
    });

    it('displays the subtitle if show subtitle true', function () {
        let subtitle_widget = Gtk.test_find_label(dynamic_banner, 'A Cute Pig');
        expect(subtitle_widget).not.toBeNull();
    });

    it('does not displays the subtitle if show subtitle false', function () {
        dynamic_banner = new Dynamic.Dynamic();
        let subtitle_widget = Gtk.test_find_label(dynamic_banner, 'A Cute Pig');
        expect(subtitle_widget).toBeNull();
    });

    it('has a subtitle with the subtitle CSS class', function () {
        let subtitle_widget = Gtk.test_find_label(dynamic_banner, 'A Cute Pig');
        expect(subtitle_widget).toHaveCssClass('BannerDynamic__subtitle');
    });

    it('justifies the subtitle appropriately to its alignment', function () {
        Gtk.Widget.set_default_direction(Gtk.TextDirection.LTR);
        let expected_justifications = {};
        expected_justifications[Gtk.Align.START] = Gtk.Justification.LEFT;
        expected_justifications[Gtk.Align.END] = Gtk.Justification.RIGHT;
        expected_justifications[Gtk.Align.CENTER] = Gtk.Justification.CENTER;
        expected_justifications[Gtk.Align.FILL] = Gtk.Justification.CENTER;

        for (let align in expected_justifications) {
            let dynamic_banner = new Dynamic.Dynamic({
                show_subtitle: true,
                halign: align,
            });
            let subtitle_widget = Gtk.test_find_label(dynamic_banner, 'A Cute Pig');
            expect(subtitle_widget.justify).toBe(expected_justifications[align]);
        }
    });
});
