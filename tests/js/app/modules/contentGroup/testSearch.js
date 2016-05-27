// Copyright 2015 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const Arrangement = imports.app.interfaces.arrangement;
const Compliance = imports.tests.compliance;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const Module = imports.app.interfaces.module;
const MockFactory = imports.tests.mockFactory;
const Search = imports.app.modules.contentGroup.search;
const WidgetDescendantMatcher = imports.tests.WidgetDescendantMatcher;

Gtk.init(null);

describe('ContentGroup.Search', function () {
    let factory, search_module, arrangement, dispatcher;

    beforeEach(function () {
        jasmine.addMatchers(CssClassMatcher.customMatchers);
        jasmine.addMatchers(WidgetDescendantMatcher.customMatchers);

        dispatcher = MockDispatcher.mock_default();
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('results-card', Minimal.MinimalCard);
        factory.add_named_mock('results-arrangement', Minimal.MinimalArrangement, {
            'card-type': 'results-card',
        });
        factory.add_named_mock('search-module', Search.Search, {
            'arrangement': 'results-arrangement',
        });
        search_module = factory.create_named_module('search-module');
        search_module.show_all();
        arrangement = factory.get_created_named_mocks('results-arrangement')[0];
        spyOn(arrangement, 'highlight_string');
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
        expect(search_module).toHaveCssClass('search-results');
    });

    it('displays the spinner when a search is started', function () {
        search_module.visible_child_name = 'message';
        dispatcher.dispatch({
            action_type: Actions.SEARCH_STARTED,
            query: 'myfoobar',
        });
        expect(search_module.visible_child_name).toBe('spinner');
    });

    it('only activates the spinner when it is shown', function () {
        search_module.visible_child_name = 'message';
        Utils.update_gui();
        expect(search_module.get_child_by_name('spinner').active).toBe(false);
        dispatcher.dispatch({
            action_type: Actions.SEARCH_STARTED,
            query: 'myfoobar',
        });
        Utils.update_gui();
        expect(search_module.get_child_by_name('spinner').active).toBe(true);
    });

    it('displays the search page when there are search results', function () {
        search_module.visible_child_name = 'message';
        dispatcher.dispatch({
            action_type: Actions.APPEND_SEARCH,
            models: [new ContentObjectModel.ContentObjectModel()],
        });
        dispatcher.dispatch({
            action_type: Actions.SEARCH_READY,
            query: 'myfoobar',
        });
        expect(search_module).not.toHaveCssClass('no-results');
        expect(search_module.visible_child_name).toBe('results');
    });

    it('displays the message page with the results CSS class when there are no results', function () {
        search_module.visible_child_name = 'message';
        dispatcher.dispatch({
            action_type: Actions.SEARCH_READY,
            query: 'myfoobar',
        });

        expect(dispatcher.dispatched_payloads).toContain(jasmine.objectContaining({
            action_type: Actions.NEED_MORE_SUGGESTED_ARTICLES,
            query: 'myfoobar',
        }));

        expect(search_module.visible_child_name).toBe('message');
        expect(search_module).toHaveCssClass('no-results');
        expect(search_module).toHaveDescendantWithCssClass('results-message-title');
    });

    it('displays the message page with the error CSS class when the search fails', function () {
        search_module.visible_child_name = 'results';
        dispatcher.dispatch({
            action_type: Actions.SEARCH_FAILED,
            query: 'myfoobar',
            error: new Error(),
        });
        expect(search_module.visible_child_name).toBe('message');
        expect(search_module).toHaveDescendantWithCssClass('error-message');
    });

    it('adds results to the card container', function () {
        dispatcher.dispatch({
            action_type: Actions.APPEND_SEARCH,
            models: [new ContentObjectModel.ContentObjectModel()],
        });
        expect(arrangement.get_count()).toBe(1);
    });

    it('removes old results from the card container when adding new ones', function () {
        dispatcher.dispatch({
            action_type: Actions.APPEND_SEARCH,
            models: [new ContentObjectModel.ContentObjectModel()],
        });
        dispatcher.dispatch({
            action_type: Actions.CLEAR_SEARCH,
        });
        expect(arrangement.get_count()).toBe(0);
    });

    it('dispatches when an infinite scrolled window arrangement reaches the end', function () {
        const InfiniteArrangement = new Module.Class({
            Name: 'InfiniteArrangement',
            Extends: InfiniteScrolledWindow.InfiniteScrolledWindow,
            Implements: [Arrangement.Arrangement],
        });

        factory.add_named_mock('infinite-arrangement', InfiniteArrangement, {
            'card-type': 'results-card',
        });
        factory.add_named_mock('infinite-module', Search.Search, {
            'arrangement': 'infinite-arrangement',
        });
        search_module = factory.create_named_module('infinite-module');
        arrangement = factory.get_created_named_mocks('infinite-arrangement')[0];

        arrangement.emit('need-more-content');
        expect(dispatcher.last_payload_with_type(Actions.NEED_MORE_SEARCH)).toBeDefined();
    });

    it('highlights a card', function () {
        spyOn(arrangement, 'highlight');
        let model = new ContentObjectModel.ContentObjectModel();
        dispatcher.dispatch({
            action_type: Actions.APPEND_SEARCH,
            models: [model],
        });
        dispatcher.dispatch({
            action_type: Actions.HIGHLIGHT_ITEM,
            model: model,
        });
        expect(arrangement.highlight).toHaveBeenCalledWith(model);
    });

    it('clears the highlight', function () {
        spyOn(arrangement, 'clear_highlight');
        dispatcher.dispatch({
            action_type: Actions.CLEAR_HIGHLIGHTED_ITEM,
        });
        expect(arrangement.clear_highlight).toHaveBeenCalled();
    });

    it('dispatches search clicked', function () {
        let model = new ContentObjectModel.ContentObjectModel();
        dispatcher.dispatch({
            action_type: Actions.APPEND_SEARCH,
            models: [ model ],
            query: 'foo',
        });
        arrangement.emit('card-clicked', model);
        Utils.update_gui();
        let payload = dispatcher.last_payload_with_type(Actions.SEARCH_CLICKED);
        let matcher = jasmine.objectContaining({
            model: model,
            context: [ model ],
        });
        expect(payload).toEqual(matcher);
    });

    it('tells the arrangement to highlight search strings', function () {
        let model = new ContentObjectModel.ContentObjectModel();
        dispatcher.dispatch({
            action_type: Actions.APPEND_SEARCH,
            models: [ model ],
            query: 'foo',
        });
        Utils.update_gui();
        expect(arrangement.highlight_string).toHaveBeenCalledWith('foo');
    });
});

Compliance.test_card_container_fade_in_compliance(Actions.APPEND_SEARCH,
    Search.Search);
