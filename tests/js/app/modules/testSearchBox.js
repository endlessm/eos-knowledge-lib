// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Actions = imports.app.actions;
const CssClassMatcher = imports.tests.CssClassMatcher;
const ContentObjectModel = imports.search.contentObjectModel;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const SearchBox = imports.app.modules.searchBox;
const StyleClasses = imports.app.styleClasses;

describe('Search box module', function () {
    let box, engine, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        engine = MockEngine.mock_default();
        dispatcher = MockDispatcher.mock_default();
        box = new SearchBox.SearchBox();
    });

    it('constructs', function () {
        expect(box).toBeDefined();
    });

    it('has the correct style class', function () {
        expect(box).toHaveCssClass(StyleClasses.SEARCH_BOX);
    });

    it('sets search text when set-search-text is dispatched', function () {
        dispatcher.dispatch({
            action_type: Actions.SET_SEARCH_TEXT,
            text: 'foo',
        });
        expect(box.text).toBe('foo');
    });

    it('has focus when focus-search is dispatched', function () {
        // Search box needs to be mapped and realized before grabbing focus can
        // take effect, so we stick it in a Gtk.Window first.
        let win = new Gtk.OffscreenWindow();
        win.add(box);
        win.show_all();
        dispatcher.dispatch({
            action_type: Actions.FOCUS_SEARCH,
        });
        expect(box.is_focus).toBe(true);
    });

    it('dispatches search-text-entered when text is activated', function () {
        box.set_text_programmatically('foo');
        box.emit('activate');
        let payload = dispatcher.last_payload_with_type(Actions.SEARCH_TEXT_ENTERED);
        expect(payload.text).toBe('foo');
    });

    it('calls into engine for auto complete results', function () {
        engine.get_objects_by_query_finish.and.returnValue([[], null]);
        box.text = 'foo';
        expect(engine.get_objects_by_query).toHaveBeenCalled();
    });

    it('dispatches autocomplete-selected when a item is selected', function () {
        let model = new ContentObjectModel.ContentObjectModel({
            ekn_id: 'ekn://aaaabbbbccccdddd',
            title: 'foo',
        });
        engine.get_objects_by_query_finish.and.returnValue([[ model ], null]);
        box.text = 'foo';
        box.emit('menu-item-selected', 'ekn://aaaabbbbccccdddd');
        let payload = dispatcher.last_payload_with_type(Actions.AUTOCOMPLETE_CLICKED);
        expect(payload.model).toBe(model);
        expect(payload.context).toEqual([ model ]);
    });
});
