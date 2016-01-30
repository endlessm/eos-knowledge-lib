// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const MockFactory = imports.tests.mockFactory;
const ResponsiveMarginsModule = imports.app.modules.responsiveMarginsModule;
const Utils = imports.tests.utils;

Gtk.init(null);

describe('Responsive margins module', function () {
    let responsive_margins, factory;

    beforeEach(function () {
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('content', Gtk.Label);
        factory.add_named_mock('module', ResponsiveMarginsModule.ResponsiveMarginsModule, {
            'content': 'content',
        });

        responsive_margins = new ResponsiveMarginsModule.ResponsiveMarginsModule({
            factory: factory,
            factory_name: 'module',
        });

        let provider = new Gtk.CssProvider();
        provider.load_from_data('\
        .tiny {\
          margin: 0px;\
        }\
        .small {\
          margin: 10px;\
        }\
        .medium {\
          margin: 20px;\
        }\
        .large {\
          margin: 30px;\
        }\
        .xlarge {\
          margin: 40px;\
        }');
        responsive_margins.get_style_context().add_provider(provider, 800);
    });

    it('constructs', function () {});

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

                expect(total_width).toBe(responsive_margins.get_allocated_width() + margin * 2);
            });
        });
    }

    testMarginsForDimensions(720, 0);
    testMarginsForDimensions(800, 10);
    testMarginsForDimensions(1100, 20);
    testMarginsForDimensions(1400, 30);
    testMarginsForDimensions(1600, 40);
});

