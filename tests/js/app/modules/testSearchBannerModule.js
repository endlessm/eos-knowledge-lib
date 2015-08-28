const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const SearchBannerModule = imports.app.modules.searchBannerModule;

Gtk.init(null);

describe('Search banner widget', function () {
    let searchBannerModule;

    beforeEach(function () {
        searchBannerModule = new SearchBannerModule.SearchBannerModule();
    });

    it('constructs', function () {});
});
