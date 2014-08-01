const EosKnowledge = imports.gi.EosKnowledge;
const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.CssClassMatcher;
const WidgetDescendantMatcher = imports.WidgetDescendantMatcher;

const TESTDIR = Endless.getCurrentFileDir() + '/..';

EosKnowledge.init();


describe('No Search Results page for Template b', function () {
    let no_search_results_page;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        no_search_results_page = new EosKnowledge.NoSearchResultsPageB({
            title: "History of Guatemala"
        });

        no_search_results_page.connect('notify', function (object, pspec) {
            // Seems properties defined in js can only be accessed through
            // object[name] with the underscore variant on the name
            notify(pspec.name, object[pspec.name.replace('-', '_')]);
        });

    });

    it('can be constructed', function () {});

    it('can set title', function () {
        let the_title = 'Results for "Foo"';
        no_search_results_page.title = the_title;
        expect(no_search_results_page.title).toBe(the_title);
    });

    describe('Style class of section page', function () {
        it('has no-search-results-page-a class', function () {
            expect(no_search_results_page).toHaveCssClass(EosKnowledge.STYLE_CLASS_NO_SEARCH_RESULTS_PAGE_B);
        });

        it('has a descendant with title class', function () {
            expect(no_search_results_page).toHaveDescendantWithCssClass(EosKnowledge.STYLE_CLASS_NO_SEARCH_RESULTS_PAGE_TITLE);
        });
    });
});
