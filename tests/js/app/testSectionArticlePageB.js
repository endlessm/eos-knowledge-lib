const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

Gtk.init(null);

const CssClassMatcher = imports.tests.CssClassMatcher;
const SectionArticlePage = imports.app.sectionArticlePage;

describe ('Section Article Page B', function () {
    let the_section_article_page;

    beforeEach (function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        the_section_article_page = new SectionArticlePage.SectionArticlePageB();
        the_section_article_page.show_all();
    });

    it ('can be constructed', function () {
        expect(the_section_article_page).toBeDefined();
    });

    it ('has a back button with the correct CSS class', function () {
        expect(the_section_article_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_NAV_BACK_BUTTON);
    });
});
