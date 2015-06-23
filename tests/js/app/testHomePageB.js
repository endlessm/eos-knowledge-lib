const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const HomePageB = imports.app.homePageB;
const MinimalCard = imports.tests.minimalCard;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.tests.utils;

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();
const THROWING_CARD_COUNTS = [1, 3, 5, 7];
const NO_THROWING_CARD_COUNTS = [4, 6, 8];

Gtk.init(null);

describe('Home page for Template B', function () {
    let home_page, card_list;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        card_list = [0, 1, 2, 3, 4, 5].map(() => new MinimalCard.MinimalCard());
        home_page = new HomePageB.HomePageB();
    });

    it('can be constructed', function () {});

    it('can set cards', function () {
        // Seems worth testing this as having a list property in javascript
        // isn't common
        home_page.cards = card_list;
        expect(home_page.cards).toBe(card_list);
    });

    // We no longer expect these to throw so xing these tests
    xdescribe('Card cardinality', function () {
        const CARD_COUNTS_NOT_ALLOWED = [0, 1, 3, 5, 7];
        const CARD_COUNTS_ALLOWED = [4, 6, 8];

        CARD_COUNTS_ALLOWED.map(function (card_count) {
            it ('throws an error if the number of cards is ' + card_count, function () {
                expect(function () {
                    home_page.cards = card_list.slice(0, card_count);
                }).not.toThrow();
            });
        });

        CARD_COUNTS_NOT_ALLOWED.map(function (card_count) {
            it ('throws an error if the number of cards is ' + card_count, function () {
                expect(function () {
                    home_page.cards = card_list.slice(0, card_count);
                }).toThrow();
            });
        });
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
