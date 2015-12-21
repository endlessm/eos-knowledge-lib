// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const MockFactory = imports.tests.mockFactory;
const MockPlaceholder = imports.tests.mockPlaceholder;
const ScrollingTemplate = imports.app.modules.scrollingTemplate;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Scrolling template', function () {
    let factory, template;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('placeholder', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('responsive-margins', Gtk.Frame);
        factory.add_named_mock('template', ScrollingTemplate.ScrollingTemplate, {
            'content': 'placeholder',
            'responsive-margins': 'responsive-margins',
        });

        template = new ScrollingTemplate.ScrollingTemplate({
            factory: factory,
            factory_name: 'template',
        });
    });

    it('constructs', function () {});

    it('packs all its children', function () {
        let content = factory.get_created_named_mocks('placeholder')[0];
        expect(template).toHaveDescendant(content);
    });
});
