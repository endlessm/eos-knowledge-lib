// Copyright (C) 2016 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const MockFactory = imports.tests.mockFactory;
const SplitPercentageTemplate = imports.app.modules.splitPercentageTemplate;
const Utils = imports.tests.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;
const MockWidgets = imports.tests.mockWidgets;

Gtk.init(null);

describe('Split percentage template', function () {
    let template, factory, end, start;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('start', MockWidgets.MockSizeWidget);
        factory.add_named_mock('end', MockWidgets.MockSizeWidget);
        factory.add_named_mock('start-template', SplitPercentageTemplate.SplitPercentageTemplate, {
            'start': 'start',
            'end': 'end',
        });
        template = factory.create_named_module('start-template');

        start = factory.get_created_named_mocks('start')[0];
        end = factory.get_created_named_mocks('end')[0];
    });

    it('constructs', function () {});

    it('packs all its children', function () {
        expect(template).toHaveDescendant(start);
        expect(template).toHaveDescendant(end);
    });

    it('has the end class on its end frame', function () {
        expect(template).toHaveDescendantWithCssClass('end');
    });

    it('has the start class on its start frame', function () {
        expect(template).toHaveDescendantWithCssClass('start');
    });

    describe('sizing', function () {
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
            win.set_size_request(500, 500);
        });

        afterEach(function () {
            win.destroy();
        });

        it('requests height for width with the correct values', function () {
            start.mode_spy.and.returnValue(Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH);
            end.mode_spy.and.returnValue(Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH);
            win.show_all();

            start.queue_resize();
            end.queue_resize();
            template.get_preferred_height_for_width(500);
            expect(start.height_for_width_spy).toHaveBeenCalledWith(250);
            expect(end.height_for_width_spy).toHaveBeenCalledWith(250);
        });

        it('allocate respects the start percentage style property', function () {
            win.show_all();
            Utils.update_gui();
            expect(end.get_allocated_width()).toBe(start.get_allocated_width());
        });
    });
});
