const ArticlePage = imports.app.reader.articlePage;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const ProgressLabel = imports.app.reader.progressLabel;
const StyleClasses = imports.app.styleClasses;

describe('Article page widget', function () {
    let page;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        page = new ArticlePage.ArticlePage();
    });

    it('constructs', function () {});

    it('has a progress-label widget', function () {
        expect(page.progress_label).toBeDefined();
        expect(page.progress_label).not.toBe(null);
        expect(page.progress_label).toBeA(ProgressLabel.ProgressLabel);
    });

    describe('CSS style context', function () {
        it('has a article page class', function () {
            expect(page).toHaveCssClass(StyleClasses.ARTICLE_PAGE);
        });
        it('has a descendant with title class', function () {
            expect(page).toHaveDescendantWithCssClass(StyleClasses.ARTICLE_PAGE_TITLE);
        });
        it('has a descendant with attribution class', function () {
            expect(page).toHaveDescendantWithCssClass(StyleClasses.READER_ARTICLE_PAGE_ATTRIBUTION);
        });
    });
});
