const EosKnowledge = imports.gi.EosKnowledge;
const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;
const WidgetDescendantMatcher = imports.WidgetDescendantMatcher;

const TESTDIR = Endless.getCurrentFileDir() + '/..';

describe('No Search Results page for Template A', function () {
    let no_search_results_page;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        no_search_results_page = new EosKnowledge.NoSearchResultsPageA({
            query: 'History of Guatemala'
        });
    });

    it('can be constructed', function () {});

    it('can set title', function () {
        // FIXME; this should actually verify that the query text is contained
        // within the title label text.
        expect(no_search_results_page.query).toBe('History of Guatemala');
    });

    describe('Style class of section page', function () {
        it('has no-search-results-page-a class', function () {
            expect(no_search_results_page).toHaveCssClass(EosKnowledge.STYLE_CLASS_NO_SEARCH_RESULTS_PAGE_A);
        });

        it('has a descendant with title class', function () {
            expect(no_search_results_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_NO_SEARCH_RESULTS_PAGE_TITLE);
        });
    });
});
