// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const TopMenu = imports.framework.modules.layout.topMenu;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Layout.TopMenu', function () {
    let template, factory;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        [template, factory] = MockFactory.setup_tree({
            type: TopMenu.TopMenu,
            slots: {
                'content': { type: MockWidgets.MockScrollingLayout },
                'top-menu': { type: null },
            },
        });
    });

    it('has widgets with the proper CSS classes', function () {
        expect(template).toHaveDescendantWithCssClass('LayoutTopMenu__menu');
    });

    it('packs all its children', function () {
        let content = factory.get_last_created('content');
        let menu = factory.get_last_created('top-menu');
        expect(template).toHaveDescendant(content);
        expect(template).toHaveDescendant(menu);
    });

    it('has the menu open by default', function () {
        expect(template.menu_open).toBeTruthy();
    });
});
