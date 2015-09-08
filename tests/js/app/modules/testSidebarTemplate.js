// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const MockFactory = imports.tests.mockFactory;
const SidebarTemplate = imports.app.modules.sidebarTemplate;
const StyleClasses = imports.app.styleClasses;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Sidebar template', function () {
    let template, factory;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('mock-sidebar', Gtk.Label);
        factory.add_named_mock('mock-content', Gtk.Label);
        factory.add_named_mock('sidebar-template', SidebarTemplate.SidebarTemplate,
        {
            'sidebar': 'mock-sidebar',
            'content': 'mock-content',
        });

        template = new SidebarTemplate.SidebarTemplate({
            factory: factory,
            factory_name: 'sidebar-template',
        });
    });

    it('constructs', function () {});

    it('packs all its children', function () {
        let sidebar = factory.get_created_named_mocks('mock-sidebar')[0];
        expect(template).toHaveDescendant(sidebar);
        let content = factory.get_created_named_mocks('mock-content')[0];
        expect(template).toHaveDescendant(content);
    });

    it('has the content-frame class on its content frame', function () {
        expect(template).toHaveDescendantWithCssClass(StyleClasses.CONTENT);
    });

    it('has the sidebar-frame class on its sidebar frame', function () {
        expect(template).toHaveDescendantWithCssClass(StyleClasses.SIDEBAR);
    });
});
