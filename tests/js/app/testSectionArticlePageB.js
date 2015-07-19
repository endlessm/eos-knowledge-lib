const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const SectionArticlePage = imports.app.sectionArticlePage;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe ('Section Article Page B', function () {
    let the_section_article_page;

    beforeEach (function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('results-arrangement',
            MockWidgets.MockScrolledArrangement);

        the_section_article_page = new SectionArticlePage.SectionArticlePageB({
            factory: factory,
        });
        the_section_article_page.show_all();
    });

    it ('can be constructed', function () {
        expect(the_section_article_page).toBeDefined();
    });

    it ('has a back button with the correct CSS class', function () {
        expect(the_section_article_page).toHaveDescendantWithCssClass(StyleClasses.NAV_BACK_BUTTON);
    });
});
