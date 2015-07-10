const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const ArticleSnippetCard = imports.app.modules.articleSnippetCard;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const MockFactory = imports.tests.mockFactory;
const OverviewPage = imports.app.reader.overviewPage;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Overview page widget', function () {
    let page;
    let snippets;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        snippets = [
            {
                title: 'Title 1',
                synopsis: 'Secrets on how to cook frango',
                article_number: 0,
            },
            {
                title: 'Title 2',
                synopsis: 'Tricks to learning to speak portuguese',
                article_number: 1,
            }
        ]
        .map((props) => new ArticleObjectModel.ArticleObjectModel(props))
        .map((model) =>
            new ArticleSnippetCard.ArticleSnippetCard({
                model: model,
            }));
        page = new OverviewPage.OverviewPage({
            factory: new MockFactory.MockFactory(),
        });
    });

    it('constructs', function () {});

    it('can set article snippets', function () {
        page.set_article_snippets(snippets);
        expect(page).toHaveDescendantWithCssClass(StyleClasses.READER_ARTICLE_SNIPPET);
    });

    it('has the overview-page CSS class', function () {
        expect(page).toHaveCssClass(StyleClasses.READER_OVERVIEW_PAGE);
    });

    it('sets the style variant class on article snippets', function () {
        page.set_article_snippets(snippets);
        expect(page).toHaveDescendantWithCssClass('snippet0');
        expect(page).toHaveDescendantWithCssClass('snippet1');
    });

    it('uses 0 as the default style variant', function () {
        page.set_article_snippets([
            new ArticleSnippetCard.ArticleSnippetCard({
                model: new ArticleObjectModel.ArticleObjectModel({
                    title: 'Frango',
                    synopsis: 'Frango tikka masala, yum',
                }),
            })
        ]);
        expect(page).toHaveDescendantWithCssClass('snippet0');
    });
});
