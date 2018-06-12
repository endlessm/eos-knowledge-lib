// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const MockFactory = imports.tests.mockFactory;
const Sidebar = imports.framework.modules.layout.sidebar;
const Utils = imports.tests.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Sidebar template', function () {
    let template, content, sidebar;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        let factory;
        [template, factory] = MockFactory.setup_tree({
            type: Sidebar.Sidebar,
            slots: {
                'sidebar': { type: null },
                'content': { type: null },
            },
        });

        sidebar = factory.get_last_created('sidebar');
        content = factory.get_last_created('content');
    });

    it('packs all its children', function () {
        expect(template).toHaveDescendant(sidebar);
        expect(template).toHaveDescendant(content);
    });

    it('has the content-frame class on its content frame', function () {
        expect(template).toHaveDescendantWithCssClass('content');
    });

    it('has the sidebar-frame class on its sidebar frame', function () {
        expect(template).toHaveDescendantWithCssClass('sidebar');
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
