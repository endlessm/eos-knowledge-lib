const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const MockDispatcher = imports.tests.mockDispatcher;
const Search = imports.app.modules.banner.search;

Gtk.init(null);

describe('Banner.Search', function () {
    let searchBanner, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        searchBanner = new Search.Search();
    });

    it('displays the query string somewhere when the search starts', function () {
        expect(Gtk.test_find_label(searchBanner, '*myfoobar*')).toBeNull();
        dispatcher.dispatch({
            action_type: Actions.SEARCH_STARTED,
            query: 'myfoobar',
        });
        Utils.update_gui();
        expect(Gtk.test_find_label(searchBanner, '*myfoobar*')).not.toBeNull();
    });

    it('displays the query string somewhere when the search is complete', function () {
        expect(Gtk.test_find_label(searchBanner, '*myfoobar*')).toBeNull();
        dispatcher.dispatch({
            action_type: Actions.SEARCH_READY,
            query: 'myfoobar',
        });
        Utils.update_gui();
        expect(Gtk.test_find_label(searchBanner, '*myfoobar*')).not.toBeNull();
    });
});
