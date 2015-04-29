const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const OverviewPage = imports.app.reader.overviewPage;

describe('Overview page widget', function () {
    let page;
    let snippets;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
        let snippet_data = [
            {
                title: 'Title 1',
                synopsis: 'Secrets on how to cook frango',
                style_variant: 0,
            },
            {
                title: 'Title 2',
                synopsis: 'Tricks to learning to speak portuguese',
                style_variant: 1,
            }
        ]

        snippets = snippet_data.map((props) => {
            return new OverviewPage.ArticleSnippet(props);
        });
        page = new OverviewPage.OverviewPage();
    });

    it('constructs', function () {});

    it('can set article snippets', function () {
        page.set_article_snippets(snippets);
        expect(page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_READER_ARTICLE_SNIPPET);
    });

    it('has the overview-page CSS class', function () {
        expect(page).toHaveCssClass(EosKnowledge.STYLE_CLASS_READER_OVERVIEW_PAGE);
    });

    it('sets the style variant class on article snippets', function () {
        page.set_article_snippets(snippets);
        expect(page).toHaveDescendantWithCssClass('snippet0');
        expect(page).toHaveDescendantWithCssClass('snippet1');
    });

    it('does not set a style variant class for style variant -1', function () {
        page.set_article_snippets([
            new OverviewPage.ArticleSnippet({
                title: 'Frango',
                synopsis: 'Frango tikka masala, yum',
                style_variant: -1,
            })
        ]);
        expect(page).not.toHaveDescendantWithCssClass('snippet-1');
        expect(page).not.toHaveDescendantWithCssClass('snippet0');
    });

    it('uses 0 as the default style variant', function () {
        page.set_article_snippets([
            new OverviewPage.ArticleSnippet({
                title: 'Frango',
                synopsis: 'Frango tikka masala, yum',
            })
        ]);
        expect(page).toHaveDescendantWithCssClass('snippet0');
    });
});
