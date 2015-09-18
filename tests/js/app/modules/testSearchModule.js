// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockFactory = imports.tests.mockFactory;
const SearchModule = imports.app.modules.searchModule;
const StyleClasses = imports.app.styleClasses;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('Search module', function () {
    let factory, search_module, arrangement, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        dispatcher = MockDispatcher.mock_default();
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('results-card', Minimal.MinimalCard);
        factory.add_named_mock('results-arrangement',
            Minimal.MinimalArrangement);
        factory.add_named_mock('search-module', SearchModule.SearchModule, {
            arrangement: 'results-arrangement',
            card_type: 'results-card',
        });
        search_module = new SearchModule.SearchModule({
            factory: factory,
            factory_name: 'search-module',
        });
        arrangement = factory.get_created_named_mocks('results-arrangement')[0];
    });

    it('constructs', function () {});

    it('creates and packs an arrangement widget', function () {
        expect(search_module).toHaveDescendant(arrangement);
    });

    it('does not create a card widget at construct time', function () {
        let cards = factory.get_created_named_mocks('results-card');
        expect(cards.length).toEqual(0);
    });

    it('has the correct CSS class', function () {
        expect(search_module).toHaveCssClass(StyleClasses.SEARCH_RESULTS);
    });

    it('has an error label with error-message CSS class', function () {
        expect(search_module).toHaveDescendantWithCssClass(StyleClasses.ERROR_MESSAGE);
    });

    it('displays the spinner when a search is started', function () {
        search_module.visible_child_name = 'error-message';
        dispatcher.dispatch({
            action_type: Actions.SEARCH_STARTED,
            query: 'myfoobar',
        });
        expect(search_module.visible_child_name).toBe('spinner');
    });

    it('displays the search page when there are search results', function () {
        search_module.visible_child_name = 'error-message';
        dispatcher.dispatch({
            action_type: Actions.APPEND_SEARCH,
            models: [new ContentObjectModel.ContentObjectModel()],
        });
        dispatcher.dispatch({
            action_type: Actions.SEARCH_READY,
            query: 'myfoobar',
        });
        expect(search_module.visible_child_name).toBe('results');
    });

    it('displays the no results page when there are no results', function () {
        search_module.visible_child_name = 'error-message';
        dispatcher.dispatch({
            action_type: Actions.SEARCH_READY,
            query: 'myfoobar',
        });
        expect(search_module.visible_child_name).toBe('no-results-message');
    });

    it('displays the error page when told to', function () {
        search_module.visible_child_name = 'results';
        dispatcher.dispatch({
            action_type: Actions.SEARCH_FAILED,
            query: 'myfoobar',
            error: new Error(),
        });
        expect(search_module.visible_child_name).toBe('error-message');
    });

    it('adds results to the card container', function () {
        dispatcher.dispatch({
            action_type: Actions.APPEND_SEARCH,
            models: [new ContentObjectModel.ContentObjectModel()],
        });
        expect(arrangement.get_cards().length).toBe(1);
    });

    it('removes old results from the card container when adding new ones', function () {
        dispatcher.dispatch({
            action_type: Actions.APPEND_SEARCH,
            models: [new ContentObjectModel.ContentObjectModel()],
        });
        dispatcher.dispatch({
            action_type: Actions.CLEAR_SEARCH,
        });
        expect(arrangement.get_cards().length).toBe(0);
    });
});
