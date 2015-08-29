// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const CssClassMatcher = imports.tests.CssClassMatcher;
const InstanceOfMatcher = imports.tests.InstanceOfMatcher;
const MockFactory = imports.tests.mockFactory;
const SearchPage = imports.app.searchPage;

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
});
