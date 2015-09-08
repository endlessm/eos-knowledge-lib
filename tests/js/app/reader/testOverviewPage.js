const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ArticleObjectModel = imports.search.articleObjectModel;
const ArticleSnippetCard = imports.app.modules.articleSnippetCard;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
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

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('front-cover', MockWidgets.MockSidebarTemplate);
        page = new OverviewPage.OverviewPage({
            factory: factory,
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
});
