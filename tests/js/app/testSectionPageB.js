const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const SectionPageB = imports.app.sectionPageB;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Section page for Template B', function () {
    let section_page, card_list;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('item-group', MockWidgets.MockItemGroup);

        section_page = new SectionPageB.SectionPageB({
            factory: factory,
        });
        card_list = [0, 1, 2].map(() => new Minimal.MinimalCard());
    });

    it('can be constructed', function () {});

    describe('Style class of section page', function () {
        it('has section-page-b class', function () {
            expect(section_page).toHaveCssClass(StyleClasses.SECTION_PAGE_B);
        });
    });
});
