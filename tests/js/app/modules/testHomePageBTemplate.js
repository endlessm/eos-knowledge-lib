// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const CssClassMatcher = imports.tests.CssClassMatcher;
const HomePageBTemplate = imports.app.modules.homePageBTemplate;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const MockPlaceholder = imports.tests.mockPlaceholder;
const StyleClasses = imports.app.styleClasses;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('HomePageBTemplate module', function () {
    let home_page;
    let factory;
    let card_list;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('Placeholder1', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('Placeholder2', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('Placeholder3', MockPlaceholder.MockPlaceholder);
        factory.add_named_mock('home-page-template', HomePageBTemplate.HomePageBTemplate,
        {
            'top_left': 'Placeholder1',
            'top_right': 'Placeholder2',
            'bottom': 'Placeholder3',
        });

        card_list = [0, 1, 2, 3, 4, 5].map(() => new Minimal.MinimalCard());

        home_page = new HomePageBTemplate.HomePageBTemplate({
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

    it('can set cards', function () {
        let card_container = home_page.get_submodule(MockPlaceholder.MockPlaceholder);
        card_container.cards = card_list;
        expect(card_container.cards).toBe(card_list);
    });

    describe('CSS style context', function () {
        it('has home page B template class', function () {
            expect(home_page).toHaveCssClass(StyleClasses.HOME_PAGE_B_TEMPLATE);
        });

        it('has home page class', function () {
            expect(home_page).toHaveCssClass(StyleClasses.HOME_PAGE);
        });
    });
});
