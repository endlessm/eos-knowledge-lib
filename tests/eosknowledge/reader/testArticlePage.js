const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;
const InstanceOfMatcher = imports.InstanceOfMatcher;

describe('Article page widget', function () {
    let page;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        page = new EosKnowledge.Reader.ArticlePage();
    });

    it('constructs', function () {});

    it('has a progress-label widget', function () {
        expect(page.progress_label).toBeDefined();
        expect(page.progress_label).not.toBe(null);
        expect(page.progress_label).toBeA(EosKnowledge.Reader.ProgressLabel);
    });

    describe('CSS style context', function () {
        it('has a article page class', function () {
            expect(page).toHaveCssClass(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE);
        });
        it('has a descendant with title class', function () {
            expect(page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_TITLE);
        });
        it('has a descendant with attribution class', function () {
            expect(page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_READER_ARTICLE_PAGE_ATTRIBUTION);
        });
    });
});
