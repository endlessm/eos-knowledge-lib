// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const BannerTemplate = imports.app.modules.bannerTemplate;
const CssClassMatcher = imports.tests.CssClassMatcher;
const MockFactory = imports.tests.mockFactory;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Banner template', function () {
    let template, factory;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('mock-banner', Gtk.Label);
        factory.add_named_mock('mock-content', Gtk.Label);
        factory.add_named_mock('banner-template', BannerTemplate.BannerTemplate,
        {
            'banner': 'mock-banner',
            'content': 'mock-content',
        });

        template = factory.create_named_module('banner-template');
    });

    it('constructs', function () {});

    it('packs all its children', function () {
        let banner = factory.get_created_named_mocks('mock-banner')[0];
        expect(template).toHaveDescendant(banner);
        let content = factory.get_created_named_mocks('mock-content')[0];
        expect(template).toHaveDescendant(content);
    });

    it('has a widget with separator CSS class regardless of image-separator', function () {
        expect(template).toHaveDescendantWithCssClass(Gtk.STYLE_CLASS_SEPARATOR);

        template = factory.create_named_module('banner-template', {
            image_separator: true,
        });
        expect(template).toHaveDescendantWithCssClass(Gtk.STYLE_CLASS_SEPARATOR);
    });
});
