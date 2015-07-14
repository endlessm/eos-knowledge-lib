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
const HomePageB = imports.app.modules.homePageB;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const MinimalCard = imports.tests.minimalCard;
const ModuleFactory = imports.app.moduleFactory;
const SearchBox = imports.app.modules.searchBox;
const StyleClasses = imports.app.styleClasses;

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

// JSON object that contains descriptions for tests.
const TEST_JSON = {
    "version": 2,
    "modules": {
        "home-page-b": {
            "type": "HomePageB",
            "submodules": {
                "top_left": "app-banner",
                "top_right": "search",
                "bottom": "card-container",
            }
        },
        "search": {
            "type": "SearchBox"
        },
        "card-container": {
            "type": "CardContainer"
        },
        "app-banner": {
            "type": "AppBanner",
            "properties": {
                "image-uri": Gio.File.new_for_path(TEST_CONTENT_DIR).get_child('pig1.jpg').get_uri(),
            }
        }
    }
}

Gtk.init(null);

describe('HomePageB module', function () {
    let home_page;
    let factory;
    let card_list;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);

        card_list = [0, 1, 2, 3, 4, 5].map(() => new MinimalCard.MinimalCard());

        factory = new ModuleFactory.ModuleFactory({
            app_json: TEST_JSON,
        }),
        home_page = new HomePageB.HomePageB({
            factory: factory,
        });
    });

    it('constructs', function () {});

    it('packs all its children', function() {
        expect(home_page._top_left.get_child()).toBeA(AppBanner.AppBanner);
        expect(home_page._top_right.get_child()).toBeA(SearchBox.SearchBox);
        expect(home_page._bottom.get_child()).toBeA(CardContainer.CardContainer);
    })

    it('can set cards', function () {
        home_page.cards = card_list;
        expect(home_page.cards).toBe(card_list);
    });

    describe('CSS style context', function () {
        it('has home page B class', function () {
            expect(home_page).toHaveCssClass(StyleClasses.HOME_PAGE_B);
        });

        it('has a descendant with container class', function () {
            expect(home_page).toHaveDescendantWithCssClass(StyleClasses.CARD_CONTAINER);
        });
    });
});
