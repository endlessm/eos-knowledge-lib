const Gtk = imports.gi.Gtk;

const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const HomePageA = imports.app.homePageA;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const MockSearchBox = imports.tests.mockSearchBox;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.tests.utils;

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

Gtk.init(null);

describe('Home page for Template A', () => {
    let home_page, notify, card_list;

    beforeEach(() => {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('home-search', MockSearchBox.MockSearchBox);
        home_page = new HomePageA.HomePageA({
            factory: factory,
        });

        notify = jasmine.createSpy('notify');
        home_page.connect('notify', (object, pspec) => {
            // Seems properties defined in js can only be accessed through
            // object[name] with the underscore variant on the name
            notify(pspec.name, object[pspec.name.replace('-', '_')]);
        });

        let model_list = [
            new ContentObjectModel.ContentObjectModel({
                title: 'Synopsised Card',
                synopsis: 'This is the Synopsis',
                featured: false,
            }),
            new ContentObjectModel.ContentObjectModel({
                title: 'Featured Picture Card',
                thumbnail_uri: TEST_CONTENT_DIR + 'pig1.jpg',
                featured: true,
            }),
            new ContentObjectModel.ContentObjectModel({
                title: 'Everything card',
                synopsis: 'This card has everything',
                thumbnail_uri: TEST_CONTENT_DIR + 'pig2.jpg',
                featured: true,
            }),
        ];
        card_list = model_list.map((model) =>
            new Minimal.MinimalCard({ model: model }));
    });

    it('can be constructed', () => {});

    it('can set cards', () => {
        // Seems worth testing this as having a list property in javascript
        // isn't common
        home_page.cards = card_list;

        let get_title = (card) => card.model.title;

        // sort existing/expected lists alphabetically for comparing members
        // independent of pack_cards implementation
        let expected_card_list = card_list.map(get_title).sort();
        let existing_card_list = home_page.cards.map(get_title).sort();
        expect(existing_card_list).toEqual(expected_card_list);
    });

    it('orders featured cards first', () => {
        home_page.cards = card_list;

        expect(home_page.cards.map((card) => card.model.featured)).toEqual([
            true,
            true,
            false,
        ]);
    });

    describe('Style class of table of contents', () => {
        it('has home_page class', () => {
            expect(home_page).toHaveCssClass(StyleClasses.HOME_PAGE_A);
        });
        it('has a descendant with container class', () => {
            expect(home_page).toHaveDescendantWithCssClass(StyleClasses.CARD_CONTAINER);
        });
    });
});
