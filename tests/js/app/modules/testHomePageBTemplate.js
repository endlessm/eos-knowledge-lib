// Copyright 2015 Endless Mobile, Inc.

const Lang = imports.lang;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;

const Utils = imports.tests.utils;
Utils.register_gresource();

const AppBanner = imports.app.modules.appBanner;
const CardContainer = imports.app.modules.cardContainer;
const CssClassMatcher = imports.tests.CssClassMatcher;
const HomePageBTemplate = imports.app.modules.homePageBTemplate;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const Minimal = imports.tests.minimal;
const MockCardContainer = imports.tests.mockCardContainer;
const MockFactory = imports.tests.mockFactory;
const MockPlaceholder = imports.tests.mockPlaceholder;
const StyleClasses = imports.app.styleClasses;

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

Gtk.init(null);

describe('HomePageBTemplate module', function () {
    let home_page;
    let factory;
    let card_list;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('Placeholder1', MockPlaceholder.MockPlaceholder, {}, { 'name': 'top-left-placeholder' });
        factory.add_named_mock('Placeholder2', MockPlaceholder.MockPlaceholder, {}, { 'name': 'top-right-placeholder' });
        factory.add_named_mock('card-container', MockCardContainer.MockCardContainer, {}, { 'name': 'bottom-placeholder' });
        factory.add_named_mock('home-page-template', HomePageBTemplate.HomePageBTemplate,
        {
            'top_left': 'Placeholder1',
            'top_right': 'Placeholder2',
            'bottom': 'card-container',
        });

        card_list = [0, 1, 2, 3, 4, 5].map(() => new Minimal.MinimalCard());

        home_page = new HomePageBTemplate.HomePageBTemplate({
            factory: factory,
            factory_name: 'home-page-template',
        });
    });

    it('constructs', function () {});

    it('packs all its children', function() {
        expect(home_page._top_left.name).toBe('top-left-placeholder');
        expect(home_page._top_right.name).toBe('top-right-placeholder');
        expect(home_page._bottom.name).toBe('bottom-placeholder');
    })

    it('can set cards', function () {
        let card_container = home_page.get_submodule(MockCardContainer.MockCardContainer);
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

        it('has a descendant with container class', function () {
            expect(home_page).toHaveDescendantWithCssClass(StyleClasses.CARD_CONTAINER);
        });
    });
});
