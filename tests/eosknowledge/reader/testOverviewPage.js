const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;
const InstanceOfMatcher = imports.InstanceOfMatcher;

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
            },
            {
                title: 'Title 2',
                synopsis: 'Tricks to learning to speak portuguese',
            }
        ]
        page = new EosKnowledge.Reader.OverviewPage();
    });

    it('constructs', function () {});

    it('can set article snippets', function () {
        page.set_article_snippets(snippets);
        expect(page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_READER_ARTICLE_SNIPPET);
    });

    it('has the overview-page CSS class', function () {
        expect(page).toHaveCssClass(EosKnowledge.STYLE_CLASS_READER_OVERVIEW_PAGE);
    });
});
