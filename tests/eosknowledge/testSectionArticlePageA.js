const EosKnowledge = imports.gi.EosKnowledge;
const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;

Gtk.init(null);

const CssClassMatcher = imports.CssClassMatcher;

const TESTDIR = Endless.getCurrentFileDir() + '/..';

describe ('Section -  Article Page', function () {
    let the_section_article_page;
    it ('shows the article when show-article is true', function () {
        the_section_article_page.show_article = true;
        expect(the_section_article_page.article_page.visible).toBe(true);
    });

    beforeEach (function () {
        jasmine.addMatchers (CssClassMatcher.customMatchers);

        the_section_article_page = new EosKnowledge.SectionArticlePageA ({
            section_page: new Gtk.Label(),
            article_page: new Gtk.Label()
        });
        the_section_article_page.show_all();
    });

    it ('can be constructed', function () {
        expect(the_section_article_page).toBeDefined();
    });

    it ('has a back button with the correct CSS class', function () {
        expect(the_section_article_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_SECTION_PAGE_BACK_BUTTON);
    });

    // TODO Refactor this so that it appropriately tests whether the page is visible
    xit ('shows the article when show-article is true', function () {
        the_section_article_page.show_article = true;
        expect (the_section_article_page.article_page.visible).toBe(true);
    });

    // TODO Refactor this so that it appropriately tests whether the page is visible
    xit ('shows the section when show-section is true', function () {
        the_section_article_page.show_section = false;
        expect (the_section_article_page.section_page.visible).toBe(true);
    });
});
