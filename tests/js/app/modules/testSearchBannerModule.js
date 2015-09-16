const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const MockDispatcher = imports.tests.mockDispatcher;
const SearchBannerModule = imports.app.modules.searchBannerModule;

Gtk.init(null);

describe('Search banner widget', function () {
    let searchBannerModule, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        searchBannerModule = new SearchBannerModule.SearchBannerModule();
    });

    it('constructs', function () {});

    it('displays the query string somewhere when the search starts', function () {
        expect(Gtk.test_find_label(searchBannerModule, '*myfoobar*')).toBeNull();
        dispatcher.dispatch({
            action_type: Actions.SEARCH_STARTED,
            query: 'myfoobar',
        });
        Utils.update_gui();
        expect(Gtk.test_find_label(searchBannerModule, '*myfoobar*')).not.toBeNull();
    });

    it('displays the query string somewhere when the search is complete', function () {
        expect(Gtk.test_find_label(searchBannerModule, '*myfoobar*')).toBeNull();
        dispatcher.dispatch({
            action_type: Actions.SEARCH_READY,
            query: 'myfoobar',
        });
        Utils.update_gui();
        expect(Gtk.test_find_label(searchBannerModule, '*myfoobar*')).not.toBeNull();
    });
});
