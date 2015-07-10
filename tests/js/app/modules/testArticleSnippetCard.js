const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const ArticleSnippetCard = imports.app.modules.articleSnippetCard;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Article snippet', function () {
    let snippet;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        snippet = new ArticleSnippetCard.ArticleSnippetCard({
            model: new ContentObjectModel.ContentObjectModel(),
        });
    });

    it('constructs', function () {});

    it('has the correct style classes', function () {
        expect(snippet).toHaveCssClass(StyleClasses.READER_ARTICLE_SNIPPET);
        expect(snippet.title_label).toHaveCssClass(StyleClasses.READER_TITLE);
        expect(snippet.synopsis_label).toHaveCssClass(StyleClasses.READER_SYNOPSIS);
    });

    it('sets style variant classes to variants [0, 2]', function () {
        [0, 1, 2].forEach((variant) => {
            snippet = new ArticleSnippetCard.ArticleSnippetCard({
                model: new ArticleObjectModel.ArticleObjectModel({
                    article_number: variant,
                }),
            });
            expect(snippet).toHaveCssClass('snippet' + variant);
        });
    });
});
