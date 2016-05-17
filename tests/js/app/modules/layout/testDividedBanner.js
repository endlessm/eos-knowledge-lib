// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const DividedBanner = imports.app.modules.layout.dividedBanner;
const MockFactory = imports.tests.mockFactory;
const MockPlaceholder = imports.tests.mockPlaceholder;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

const ORIG_ROW_SPACING = 30;

Gtk.init(null);

describe('DividedBannerTemplate module', function () {
    let home_page;
    let factory;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('Placeholder1', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('Placeholder2', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('Placeholder3', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('home-page-template', DividedBanner.DividedBanner,
        {
            'top-left': 'Placeholder1',
            'top-right': 'Placeholder2',
            'bottom': 'Placeholder3',
        });
        home_page = factory.create_named_module('home-page-template');
    });

    it('constructs', function () {});

    it('packs all its children', function () {
        let top_left = factory.get_created_named_mocks('Placeholder1')[0];
        expect(home_page).toHaveDescendant(top_left);
        let top_right = factory.get_created_named_mocks('Placeholder2')[0];
        expect(home_page).toHaveDescendant(top_right);
        let bottom = factory.get_created_named_mocks('Placeholder3')[0];
        expect(home_page).toHaveDescendant(bottom);
    });

    describe('CSS style context', function () {
        it('has divided banner template class', function () {
            expect(home_page).toHaveCssClass('divided-banner-template');
        });
    });

    describe("when allocates size", function () {
        let win;

        beforeEach(function () {
            win = new Gtk.OffscreenWindow();
            home_page.row_spacing = ORIG_ROW_SPACING;
            win.add(home_page);
            win.show_all();
        });

        afterEach(function () {
            win.destroy();
        });

        it('sets the original row spacing', function () {
            win.set_size_request(640, 480);
            Utils.update_gui();
            expect(home_page._orig_row_spacing).toBe(ORIG_ROW_SPACING);
        });

        it('reduces spacing to half when the width available < 800px', function () {
            win.set_size_request(720, 480);
            Utils.update_gui();
            win.set_size_request(640, 480);
            Utils.update_gui();
            expect(home_page.row_spacing).toBe(home_page._orig_row_spacing / 2);
        });

        it('restores original spacing when width the available >= 800px', function () {
            win.set_size_request(800, 600);
            Utils.update_gui();
            win.set_size_request(1024, 768);
            Utils.update_gui();
            expect(home_page.row_spacing).toBe(home_page._orig_row_spacing);
        });
    });
});
