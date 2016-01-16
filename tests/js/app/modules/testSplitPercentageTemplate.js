// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const MockFactory = imports.tests.mockFactory;
const SplitPercentageTemplate = imports.app.modules.splitPercentageTemplate;
const Utils = imports.tests.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Split percentage template', function () {
    let template, factory, end, start;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('start', Gtk.Label);
        factory.add_named_mock('end', Gtk.Label);
        factory.add_named_mock('start-template', SplitPercentageTemplate.SplitPercentageTemplate,
        {
            'start': 'start',
            'end': 'end',
        });

        template = new SplitPercentageTemplate.SplitPercentageTemplate({
            factory: factory,
            factory_name: 'start-template',
        });

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

    describe('size allocate', function () {
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

        it('respects the start percentage style property', function () {
            win.set_size_request(500, 500);
            Utils.update_gui();
            expect(end.get_allocated_width()).toBe(start.get_allocated_width());
        });
    });
});
