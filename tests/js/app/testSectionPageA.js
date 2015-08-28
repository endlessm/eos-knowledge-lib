const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const Minimal = imports.tests.minimal;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const SectionPageA = imports.app.sectionPageA;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.tests.utils;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

describe('Section page for Template A', function () {
    let section_page, cards;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('item-group', MockWidgets.MockItemGroupModule);

        section_page = new SectionPageA.SectionPageA({
            factory: factory,
        });

        cards = [
            new Minimal.MinimalCard(),
            new Minimal.MinimalCard(),
            new Minimal.MinimalCard(),
        ];
    });

    it('can be constructed', function () {});

    it('can set title', function () {
        section_page.title = "Brazil";
        expect(section_page.title).toBe("Brazil");
    });

    describe('Style class of section page', function () {
        it('has section-page-a class', function () {
            expect(section_page).toHaveCssClass(StyleClasses.SECTION_PAGE_A);
        });
    });
});
