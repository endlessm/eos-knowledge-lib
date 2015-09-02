// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const BannerTemplate = imports.app.modules.bannerTemplate;
const MockFactory = imports.tests.mockFactory;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('HomePageBTemplate module', function () {
    let template, factory;

    beforeEach(function () {
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('mock-banner', Gtk.Label);
        factory.add_named_mock('mock-content', Gtk.Label);
        factory.add_named_mock('banner-template', BannerTemplate.BannerTemplate,
        {
            'banner': 'mock-banner',
            'content': 'mock-content',
        });

        template = new BannerTemplate.BannerTemplate({
            factory: factory,
            factory_name: 'banner-template',
        });
    });

    it('constructs', function () {});

    it('packs all its children', function () {
        let banner = factory.get_created_named_mocks('mock-banner')[0];
        expect(template).toHaveDescendant(banner);
        let content = factory.get_created_named_mocks('mock-content')[0];
        expect(template).toHaveDescendant(content);
    });
});
