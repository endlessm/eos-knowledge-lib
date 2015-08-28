const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const HomePageA = imports.app.homePageA;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.tests.utils;

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

Gtk.init(null);

describe('Home page for Template A', () => {
    let home_page, notify, dispatcher, model_list;

    beforeEach(() => {
        dispatcher = MockDispatcher.mock_default();

        jasmine.addMatchers(CssClassMatcher.customMatchers);

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('home-search', MockWidgets.MockSearchBox);
        factory.add_named_mock('home-card', Minimal.MinimalCard);
        home_page = new HomePageA.HomePageA({
            factory: factory,
        });

        notify = jasmine.createSpy('notify');
        home_page.connect('notify', (object, pspec) => {
            // Seems properties defined in js can only be accessed through
            // object[name] with the underscore variant on the name
            notify(pspec.name, object[pspec.name.replace('-', '_')]);
        });

        model_list = [
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
        dispatcher.dispatch({
            action_type: Actions.APPEND_SETS,
            models: model_list,
        });
    });

    it('can be constructed', () => {});

    it('sets cards from dispatcher', () => {
        let card_title_list = home_page.cards.map((card) => card.model.title).sort();
        let dispatched_title_list = model_list.map((model) => model.title).sort();
        expect(card_title_list).toEqual(dispatched_title_list);
    });

    it('orders featured cards first', () => {
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
