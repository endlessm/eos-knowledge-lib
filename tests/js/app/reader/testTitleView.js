const TitleView = imports.app.reader.titleView;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;

describe('Title view', function () {
    let view;
    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        view = new TitleView.TitleView();
    });

    it('constructs', function () {});

    it('has a child with the article-page-title CSS class', function () {
        expect(view).toHaveDescendantWithCssClass(StyleClasses.ARTICLE_PAGE_TITLE);
    });

    it('has a child with the article-page-attribution CSS class', function () {
        expect(view).toHaveDescendantWithCssClass(StyleClasses.READER_ARTICLE_PAGE_ATTRIBUTION);
    });

    it('has a child with the article-page-ornament CSS class', function () {
        expect(view).toHaveDescendantWithCssClass(StyleClasses.READER_ARTICLE_PAGE_ORNAMENT);
    });
});
