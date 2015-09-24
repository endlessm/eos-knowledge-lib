// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const DividedBannerTemplate = imports.app.modules.dividedBannerTemplate;
const MockFactory = imports.tests.mockFactory;
const MockPlaceholder = imports.tests.mockPlaceholder;
const StyleClasses = imports.app.styleClasses;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('DividedBannerTemplate module', function () {
    let home_page;
    let factory;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('Placeholder1', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('Placeholder2', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('Placeholder3', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('home-page-template', DividedBannerTemplate.DividedBannerTemplate,
        {
            'top-left': 'Placeholder1',
            'top-right': 'Placeholder2',
            'bottom': 'Placeholder3',
        });

        home_page = new DividedBannerTemplate.DividedBannerTemplate({
            factory: factory,
            factory_name: 'home-page-template',
        });
    });

    it('constructs', function () {});

    it('packs all its children', function () {
        let top_left = factory.get_created_named_mocks('Placeholder1')[0];
        expect(home_page).toHaveDescendant(top_left);
        let top_right = factory.get_created_named_mocks('Placeholder2')[0];
        expect(home_page).toHaveDescendant(top_right);
        let bottom = factory.get_created_named_mocks('Placeholder3')[0];
        expect(home_page).toHaveDescendant(bottom);
    });

    describe('CSS style context', function () {
        it('has divided banner template class', function () {
            expect(home_page).toHaveCssClass('divided-banner-template');
        });
    });
});
