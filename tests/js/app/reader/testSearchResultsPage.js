const Gtk = imports.gi.Gtk;

const SearchResultsPage = imports.app.reader.searchResultsPage;

Gtk.init(null);

describe('Search Results Page', function () {
    let page;

    beforeEach(function () {
        page = new SearchResultsPage.SearchResultsPage();
    });

    it('constructs', function () {});
});
