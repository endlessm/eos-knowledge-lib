const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const ArticleSnippet = imports.app.modules.card.articleSnippet;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;

Gtk.init(null);

describe('Article snippet', function () {
    let snippet;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);

        snippet = new ArticleSnippet.ArticleSnippet({
            model: new ContentObjectModel.ContentObjectModel(),
        });
    });

    it('constructs', function () {});

    it('has the correct style classes', function () {
        expect(snippet).toHaveCssClass('article-snippet');
        expect(snippet).toHaveDescendantWithCssClass('title');
        expect(snippet).toHaveDescendantWithCssClass('synopsis');
    });

    it('sets style variant classes to variants [0, 2]', function () {
        [0, 1, 2].forEach((variant) => {
            snippet = new ArticleSnippet.ArticleSnippet({
                model: new ArticleObjectModel.ArticleObjectModel({
                    article_number: variant,
                }),
            });
            expect(snippet).toHaveCssClass('variant' + variant);
        });
    });

    it('has labels that understand Pango markup', function () {
        let card = new ArticleSnippet.ArticleSnippet({
            model: new ContentObjectModel.ContentObjectModel({
                title: '!!!',
                synopsis: '@@@',
            })
        });
        expect(Gtk.test_find_label(card, '*!!!*').use_markup).toBeTruthy();
        expect(Gtk.test_find_label(card, '*@@@*').use_markup).toBeTruthy();
    });
});
