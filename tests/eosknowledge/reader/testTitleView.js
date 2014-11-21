const EosKnowledge = imports.gi.EosKnowledge;

const CssClassMatcher = imports.CssClassMatcher;

describe('Title view', function () {
    let view;
    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        view = new EosKnowledge.Reader.TitleView();
    });

    it('constructs', function () {});

    it('has a child with the article-page-title CSS class', function () {
        expect(view).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_ARTICLE_PAGE_TITLE);
    });

    it('has a child with the article-page-attribution CSS class', function () {
        expect(view).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_READER_ARTICLE_PAGE_ATTRIBUTION);
    });
});
