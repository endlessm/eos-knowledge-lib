// Copyright (C) 2016 Endless Mobile, Inc.

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
        template = factory.create_named_module('template');
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
});
