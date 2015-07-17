const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const ContentObjectModel = imports.search.contentObjectModel;
const SearchBanner = imports.app.modules.searchBanner;

Gtk.init(null);

describe('Search banner widget', function () {
    let searchBanner;

    beforeEach(function () {
        searchBanner = new SearchBanner.SearchBanner({
            query: 'Query',
        });
    });

    it('constructs', function () {});
});
