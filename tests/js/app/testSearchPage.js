// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const SearchPage = imports.app.searchPage;
const StyleClasses = imports.app.styleClasses;

Gtk.init(null);

describe('Search page', function () {
    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(InstanceOfMatcher.customMatchers);
    });

    it('can be constructed', function () {
        let search_page = new SearchPage.SearchPage({
            factory: new MockFactory.MockFactory(),
        });
        expect(search_page).toBeA(SearchPage.SearchPage);
    });

    it('has the appropriate style class', function () {
        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('results-arrangement',
            MockWidgets.MockScrolledArrangement);

        let search_page_a = new SearchPage.SearchPageA({
            factory: factory,
        });

        let search_page_b = new SearchPage.SearchPageB({
            factory: factory,
        });

        expect(search_page_a).toHaveCssClass(StyleClasses.SEARCH_PAGE_A);
        expect(search_page_b).toHaveCssClass(StyleClasses.SEARCH_PAGE_B);
    });
});
