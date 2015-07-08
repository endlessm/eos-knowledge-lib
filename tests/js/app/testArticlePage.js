const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gtk = imports.gi.Gtk;

const ArticlePage = imports.app.articlePage;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const StyleClasses = imports.app.styleClasses;
const TableOfContents = imports.app.tableOfContents;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Article Page A', function () {
    let page, article_a, article_b;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        page = new ArticlePage.ArticlePage();
        article_a = new Gtk.Label();
        article_b = new Gtk.Label();
    });

    it('can be constructed', function () {
        expect(page).toBeDefined();
    });

    it('transitions in new content views', function () {
        page.switch_in_document_card(article_a, EosKnowledgePrivate.LoadingAnimation.NONE);
        expect(page).toHaveDescendant(article_a);
        page.switch_in_document_card(article_b, EosKnowledgePrivate.LoadingAnimation.NONE);
        expect(page).toHaveDescendant(article_b);
    });
});
