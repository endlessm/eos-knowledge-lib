// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const MockFactory = imports.tests.mockFactory;
const SidebarTemplate = imports.app.modules.sidebarTemplate;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.tests.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Sidebar template', function () {
    let template, factory, content, sidebar;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('mock-sidebar', Gtk.Label, {}, {
            margin_end: 200,
        });
        factory.add_named_mock('mock-content', Gtk.Label, {}, {
            margin_start: 200,
        });
        factory.add_named_mock('sidebar-template', SidebarTemplate.SidebarTemplate,
        {
            'sidebar': 'mock-sidebar',
            'content': 'mock-content',
        });

        template = new SidebarTemplate.SidebarTemplate({
            factory: factory,
            factory_name: 'sidebar-template',
        });

        sidebar = factory.get_created_named_mocks('mock-sidebar')[0];
        content = factory.get_created_named_mocks('mock-content')[0];
    });

    it('constructs', function () {});

    it('packs all its children', function () {
        expect(template).toHaveDescendant(sidebar);
        expect(template).toHaveDescendant(content);
    });

    it('has the sidebar-template CSS class', function () {
        expect(template).toHaveCssClass(StyleClasses.SIDEBAR_TEMPLATE);
    });

    it('has the content-frame class on its content frame', function () {
        expect(template).toHaveDescendantWithCssClass(StyleClasses.CONTENT);
    });

    it('has the sidebar-frame class on its sidebar frame', function () {
        expect(template).toHaveDescendantWithCssClass(StyleClasses.SIDEBAR);
    });

    describe('at different sizes', function () {
        let win;

        beforeEach(function () {
            win = new Gtk.OffscreenWindow();
            template.expand = true;
            win.add(template);
            win.show_all();
        });

        afterEach(function () {
            win.destroy();
        });

        it('reduces the margins on its submodules when there is less room', function () {
            win.set_size_request(500, 500);
            Utils.update_gui();
            expect(content.margin_start).toBeLessThan(200);
            expect(sidebar.margin_end).toBeLessThan(200);
        });

        it('leaves the margins alone when there is enough room', function () {
            win.set_size_request(1500, 1500);
            Utils.update_gui();
            expect(content.margin_start).toBe(200);
            expect(sidebar.margin_end).toBe(200);
        });
    });
});
