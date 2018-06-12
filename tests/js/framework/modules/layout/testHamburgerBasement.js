// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const HamburgerBasement = imports.framework.modules.layout.hamburgerBasement;
const MockFactory = imports.tests.mockFactory;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Layout.HamburgerBasement', function () {
    let home_page, factory;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        [home_page, factory] = MockFactory.setup_tree({
            type: HamburgerBasement.HamburgerBasement,
            slots: {
                'top': { type: null },
                'middle': { type: null },
                'bottom': { type: null },
                'basement': { type: null },
            },
        });
    });

    it('packs all its children', function () {
        let top = factory.get_last_created('top');
        expect(home_page).toHaveDescendant(top);
        let middle = factory.get_last_created('middle');
        expect(home_page).toHaveDescendant(middle);
        let bottom = factory.get_last_created('bottom');
        expect(home_page).toHaveDescendant(bottom);
        let basement = factory.get_last_created('basement');
        expect(home_page).toHaveDescendant(basement);
    });

    it('has a tab button', function () {
        expect(home_page).toHaveDescendantWithClass(Gtk.Button);
    });
});
