// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const MockFactory = imports.tests.mockFactory;
const Sidebar = imports.app.modules.layout.sidebar;
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
        factory.add_named_mock('mock-sidebar', Gtk.Label);
        factory.add_named_mock('mock-content', Gtk.Label);
        factory.add_named_mock('sidebar-template', Sidebar.Sidebar, {
            'sidebar': 'mock-sidebar',
            'content': 'mock-content',
        });
        template = factory.create_named_module('sidebar-template');

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

    describe('size_allocate', function () {
        let provider, win;
        beforeAll(function () {
           provider = Utils.create_reset_provider();
           Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                                                    provider,
                                                    Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        });
        afterAll(function () {
            Gtk.StyleContext.remove_provider_for_screen(Gdk.Screen.get_default(),
                                                        provider);
        });

        beforeEach(function () {
            win = new Gtk.OffscreenWindow();
            template.expand = true;
            win.add(template);
            win.show_all();
        });

        afterEach(function () {
            win.destroy();
        });

        it('allocates large sidebar width when >= 800 pixels available', function () {
            win.set_size_request(800, 600);
            Utils.update_gui();
            expect(sidebar.get_allocated_width()).toBe(400);
        });

        it('allocates small sidebar width when < 800 pixels available', function () {
            win.set_size_request(640, 480);
            Utils.update_gui();
            expect(sidebar.get_allocated_width()).toBe(240);
        });
    });
});
