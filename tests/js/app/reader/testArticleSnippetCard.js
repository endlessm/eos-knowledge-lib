const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleSnippetCard = imports.app.reader.articleSnippetCard;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Article snippet', function () {
    let snippet;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        snippet = new ArticleSnippetCard.ArticleSnippetCard();
    });

    it('constructs', function () {});

    it('has the correct style classes', function () {
        expect(snippet).toHaveCssClass(StyleClasses.READER_ARTICLE_SNIPPET);
        expect(snippet.title_label).toHaveCssClass(StyleClasses.READER_TITLE);
        expect(snippet.synopsis_label).toHaveCssClass(StyleClasses.READER_SYNOPSIS);
    });

    it('sets style variant classes to variants [0, 2]', function () {
        let cards = [0, 1, 2].map((variant) => {
            snippet = new ArticleSnippetCard.ArticleSnippetCard({
                model: new ContentObjectModel.ContentObjectModel(),
                style_variant: variant,
            });
            expect(snippet).toHaveCssClass('snippet' + variant);
        });
    });
});
