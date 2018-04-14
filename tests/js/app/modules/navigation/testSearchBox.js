// Copyright 2015 Endless Mobile, Inc.

const {DModel, Gtk} = imports.gi;

const Utils = imports.tests.utils;
Utils.register_gresource();

Gtk.init(null);

const Actions = imports.app.actions;
const CssClassMatcher = imports.tests.CssClassMatcher;
const HistoryStore = imports.app.historyStore;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockReadingHistoryModel = imports.tests.mockReadingHistoryModel;
const Pages = imports.app.pages;
const SearchBox = imports.app.modules.navigation.searchBox;

describe('Navigation.SearchBox', function () {
    let box, engine, dispatcher, store, reading_history;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        engine = MockEngine.mock_default();
        reading_history = MockReadingHistoryModel.mock_default();
        dispatcher = MockDispatcher.mock_default();
        store = new HistoryStore.HistoryStore();
        HistoryStore.set_default(store);
        box = new SearchBox.SearchBox();
    });

    it('sets search text to search query on search page', function () {
        store.set_current_item_from_props({
            page_type: Pages.SEARCH,
            search_terms: 'foo',
        });
        expect(box.text).toBe('foo');
    });

    it('blanks search text on other pages', function () {
        store.set_current_item_from_props({ page_type: Pages.HOME });
        expect(box.text).toBe('');
        store.set_current_item_from_props({ page_type: Pages.SET });
        expect(box.text).toBe('');
        store.set_current_item_from_props({ page_type: Pages.ARTICLE });
        expect(box.text).toBe('');
        store.set_current_item_from_props({ page_type: Pages.ALL_SETS });
        expect(box.text).toBe('');
    });

    it('grabs focus when mapped if focus-on-map is set', function () {
        box.focus_on_map = true;
        // Search box needs to be mapped and realized before grabbing focus can
        // take effect, so we stick it in a Gtk.Window first.
        let win = new Gtk.OffscreenWindow();
        win.add(box);
        win.show_all();
        expect(box.is_focus).toBe(true);
    });

    it('dispatches search-text-entered when text is activated', function () {
        box.set_text_programmatically('foo');
        box.emit('activate');
        let payload = dispatcher.last_payload_with_type(Actions.SEARCH_TEXT_ENTERED);
        expect(payload.search_terms).toBe('foo');
    });

    it('calls into engine for auto complete results', function () {
        engine.query_promise.and.returnValue(Promise.resolve({ models: [] }));
        box.text = 'foo';
        expect(engine.query_promise).toHaveBeenCalled();
    });

    it('dispatches autocomplete-selected when a item is selected', function () {
        let model = new DModel.Content({
            id: 'ekn://aaaabbbbccccdddd',
            title: 'foo',
        });
        engine.query_promise.and.returnValue(Promise.resolve({ models: [model] }));
        box.text = 'foo';
        Utils.update_gui();
        box.emit('menu-item-selected', 'ekn://aaaabbbbccccdddd');
        let payload = dispatcher.last_payload_with_type(Actions.ITEM_CLICKED);
        expect(payload.model).toBe(model);
        expect(payload.context).toEqual([ model ]);
        expect(payload.search_terms).toEqual('foo');
    });
});
