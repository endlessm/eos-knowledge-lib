const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const SectionPageB = imports.app.sectionPageB;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Section page for Template B', function () {
    let section_page, card_list, arrangement;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('results-arrangement',
            MockWidgets.MockScrolledArrangement);

        section_page = new SectionPageB.SectionPageB({
            factory: factory,
        });
        arrangement = factory.get_created_named_mocks('results-arrangement')[0];

        card_list = [0, 1, 2].map(() => new Minimal.MinimalCard());
    });

    it('can be constructed', function () {});

    it('can set cards', function () {
        section_page.cards = card_list;
        expect(section_page.cards).toBe(card_list);
        expect(arrangement.get_cards().length).toBe(3);
    });

    it('can append cards', function () {
        section_page.cards = card_list;
        expect(arrangement.get_cards().length).toBe(3);
        section_page.append_cards([new Minimal.MinimalCard()]);
        expect(arrangement.get_cards().length).toBe(4);
    });

    describe('Style class of section page', function () {
        it('has section-page-b class', function () {
            expect(section_page).toHaveCssClass(StyleClasses.SECTION_PAGE_B);
        });
    });
});
