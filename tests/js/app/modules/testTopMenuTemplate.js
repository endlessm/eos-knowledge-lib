// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;
Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const MockFactory = imports.tests.mockFactory;
const TopMenuTemplate = imports.app.modules.topMenuTemplate;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

describe('Top menu template', function () {
    let template, factory;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);


        factory = new MockFactory.MockFactory();
        factory.add_named_mock('mock-content', Gtk.ScrolledWindow);
        factory.add_named_mock('mock-menu', Gtk.Label);
        factory.add_named_mock('template', TopMenuTemplate.TopMenuTemplate, {
            'content': 'mock-content',
            'top-menu': 'mock-menu',
        });
        template = new TopMenuTemplate.TopMenuTemplate({
            factory: factory,
            factory_name: 'template',
        });
    });

    it('constructs', function () {
        expect(template).toEqual(jasmine.anything());
    });

    it('has widgets with the proper CSS classes', function () {
        expect(template).toHaveDescendantWithCssClass('top-menu');
    });

    it('packs all its children', function () {
        let content = factory.get_created_named_mocks('mock-content')[0];
        let menu = factory.get_created_named_mocks('mock-menu')[0];
        expect(template).toHaveDescendant(content);
        expect(template).toHaveDescendant(menu);
    });

    it('has the menu open by default', function () {
        expect(template.menu_open).toBeTruthy();
    });

    it('hides the menu when you scroll into bottom half of the page', function () {
        let content = factory.get_created_named_mocks('mock-content')[0];
        content.vadjustment.set_upper(1000);
        content.vadjustment.set_value(600);
        Utils.update_gui();
        expect(template.menu_open).toBeFalsy();
    });

    it('closes the menu when you scroll back up to top half of the page', function () {
        let content = factory.get_created_named_mocks('mock-content')[0];
        content.vadjustment.set_upper(1000);
        content.vadjustment.set_value(600);
        Utils.update_gui();
        content.vadjustment.set_value(300);
        Utils.update_gui();
        expect(template.menu_open).toBeTruthy();
    });
});
