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

        factory = new MockFactory.MockFactory({
            'BannerTemplate': BannerTemplate.BannerTemplate,
        }, {
            type: 'BannerTemplate',
            slots: {
                'banner': {
                    type: 'Banner',
                },
                'content': {
                    type: 'Content',
                },
            },
        });
        template = factory.create_module_tree();
    });

    it('constructs', function () {});

    it('packs all its children', function () {
        let banner = factory.get_last_created_mock('Banner');
        expect(template).toHaveDescendant(banner);
        let content = factory.get_last_created_mock('Content');
        expect(template).toHaveDescendant(content);
    });
});
