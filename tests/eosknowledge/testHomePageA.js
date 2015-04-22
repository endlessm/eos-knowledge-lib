const EosKnowledge = imports.gi.EosKnowledge;

const CssClassMatcher = imports.CssClassMatcher;
const Utils = imports.tests.utils;

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

describe('Home page for Template A', () => {
    let home_page, notify, card_list;

    beforeEach(() => {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        home_page = new EosKnowledge.HomePageA();

        notify = jasmine.createSpy('notify');
        home_page.connect('notify', (object, pspec) => {
            // Seems properties defined in js can only be accessed through
            // object[name] with the underscore variant on the name
            notify(pspec.name, object[pspec.name.replace('-', '_')]);
        });

        card_list = [
            new EosKnowledge.Card({
                title: 'Synopsised Card',
                synopsis: 'This is the Synopsis',
                featured: false,
            }),
            new EosKnowledge.Card({
                title: 'Featured Picture Card',
                thumbnail_uri: TEST_CONTENT_DIR + 'pig1.jpg',
                featured: true,
            }),
            new EosKnowledge.Card({
                title: 'Everything card',
                synopsis: 'This card has everything',
                thumbnail_uri: TEST_CONTENT_DIR + 'pig2.jpg',
                featured: true,
            }),
            new EosKnowledge.LessonCard({
                title: 'Mustard lesson',
                synopsis: 'Sample, incomplete',
                // By Bogdan29roman, CC-BY-SA
                // http://en.wikipedia.org/wiki/File:Mu%C5%9Ftar.jpg
                thumbnail_uri: TEST_CONTENT_DIR + 'mustard.jpg',
                item_index: 1,
                complete: false,
                featured: false,
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
            false,
        ]);
    });

    describe('Style class of table of contents', () => {
        it('has home_page class', () => {
            expect(home_page).toHaveCssClass(EosKnowledge.STYLE_CLASS_HOME_PAGE_A);
        });
        it('has a descendant with search box class', () => {
            expect(home_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_SEARCH_BOX);
        });
        it('has a descendant with container class', () => {
            expect(home_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_CARD_CONTAINER);
        });
    });
});
