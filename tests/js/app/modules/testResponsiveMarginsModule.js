// Copyright (C) 2015-2016 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const ResponsiveMarginsModule = imports.app.modules.responsiveMarginsModule;
const Utils = imports.tests.utils;

Gtk.init(null);

describe('Responsive margins module', function () {
    let provider;
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

    let responsive_margins, factory;

    beforeEach(function () {
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('content', MockWidgets.MockSizeWidget);
        factory.add_named_mock('module', ResponsiveMarginsModule.ResponsiveMarginsModule, {
            'content': 'content',
        });
        responsive_margins = factory.create_named_module('module');

        let provider = new Gtk.CssProvider();
        provider.load_from_data('\
        .tiny {\
          margin: 10px;\
        }\
        .small {\
          margin: 20px;\
        }\
        .medium {\
          margin: 30px;\
        }\
        .large {\
          margin: 40px;\
        }\
        .xlarge {\
          margin: 50px;\
        }');
        responsive_margins.get_style_context().add_provider(provider, 800);
    });

    it('constructs', function () {});

    function test_constant_size_requests (primary) {
        describe('get preferred ' + primary, function () {
            let win;

            beforeEach(function () {
                win = new Gtk.OffscreenWindow();
                win.add(responsive_margins);
                win.show_all();
            });

            afterEach(function () {
                win.destroy();
            });

            it ('minimal includes tiny margins', function () {
                let content = factory.get_last_created_named_mock('content');
                content[primary + '_spy'].and.returnValue([50, 50]);
                content.queue_resize();
                expect(responsive_margins['get_preferred_' + primary]()[0]).toBe(70);
            });

            it ('natural includes xlarge margins', function () {
                let content = factory.get_last_created_named_mock('content');
                content[primary + '_spy'].and.returnValue([50, 50]);
                content.queue_resize();
                expect(responsive_margins['get_preferred_' + primary]()[1]).toBe(150);
            });
        });
    }
    test_constant_size_requests('width');
    test_constant_size_requests('height');

    it ('height for width passes correct width for tiny and xlarge margins', function () {
        let content = factory.get_last_created_named_mock('content');
        content.mode_spy.and.returnValue(Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH);

        let win = new Gtk.OffscreenWindow();
        win.add(responsive_margins);
        win.show_all();

        content.queue_resize();
        responsive_margins.get_preferred_height_for_width(200);
        expect(content.height_for_width_spy).toHaveBeenCalledWith(180);
        expect(content.height_for_width_spy).toHaveBeenCalledWith(100);
    });

    function testMarginsForDimensions(total_width, margin) {
        describe('at ' + total_width + ' width', function () {
            let win;
            beforeEach(function () {
                win = new Gtk.OffscreenWindow();
            });

            afterEach(function () {
                win.destroy();
            });

            it ('sets margins for internal child to ' + margin + 'px when width=' + total_width, function () {
                let label = responsive_margins.get_children()[0];
                label.expand = true;
                win.add(responsive_margins);
                win.set_size_request(total_width, 600);
                win.show_all();

                win.queue_resize();
                Utils.update_gui();

                expect(total_width).toBe(label.get_allocated_width() + margin * 2);
            });
        });
    }

    testMarginsForDimensions(720, 10);
    testMarginsForDimensions(800, 20);
    testMarginsForDimensions(1100, 30);
    testMarginsForDimensions(1400, 40);
    testMarginsForDimensions(1600, 50);
});


