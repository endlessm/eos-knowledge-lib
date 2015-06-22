const Gtk = imports.gi.Gtk;

const Card = imports.app.card;
const CssClassMatcher = imports.tests.CssClassMatcher;
const HomePageA = imports.app.homePageA;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.tests.utils;

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

Gtk.init(null);

describe('Home page for Template A', () => {
    let home_page, notify, card_list;

    beforeEach(() => {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        home_page = new HomePageA.HomePageA();

        notify = jasmine.createSpy('notify');
        home_page.connect('notify', (object, pspec) => {
            // Seems properties defined in js can only be accessed through
            // object[name] with the underscore variant on the name
            notify(pspec.name, object[pspec.name.replace('-', '_')]);
        });

        card_list = [
            new Card.Card({
                title: 'Synopsised Card',
                synopsis: 'This is the Synopsis',
                featured: false,
            }),
            new Card.Card({
                title: 'Featured Picture Card',
                thumbnail_uri: TEST_CONTENT_DIR + 'pig1.jpg',
                featured: true,
            }),
            new Card.Card({
                title: 'Everything card',
                synopsis: 'This card has everything',
                thumbnail_uri: TEST_CONTENT_DIR + 'pig2.jpg',
                featured: true,
            }),
        ];
    });

    it('can be constructed', () => {});

    it('can set cards', () => {
        // Seems worth testing this as having a list property in javascript
        // isn't common
        home_page.cards = card_list;

        let get_title = (card) => card.title;

        // sort existing/expected lists alphabetically for comparing members
        // independent of pack_cards implementation
        let expected_card_list = card_list.map(get_title).sort();
        let existing_card_list = home_page.cards.map(get_title).sort();
        expect(existing_card_list).toEqual(expected_card_list);
    });

    it('orders featured cards first', () => {
        home_page.cards = card_list;

        expect(home_page.cards.map((card) => card.featured)).toEqual([
            true,
            true,
            false,
        ]);
    });

    describe('Style class of table of contents', () => {
        it('has home_page class', () => {
            expect(home_page).toHaveCssClass(StyleClasses.HOME_PAGE_A);
        });
        it('has a descendant with search box class', () => {
            expect(home_page).toHaveDescendantWithCssClass(StyleClasses.SEARCH_BOX);
        });
        it('has a descendant with container class', () => {
            expect(home_page).toHaveDescendantWithCssClass(StyleClasses.CARD_CONTAINER);
        });
    });
});
