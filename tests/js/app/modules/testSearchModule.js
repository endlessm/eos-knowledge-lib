// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const Arrangement = imports.app.interfaces.arrangement;
const ContentObjectModel = imports.search.contentObjectModel;
const CssClassMatcher = imports.tests.CssClassMatcher;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const Module = imports.app.interfaces.module;
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
        factory.add_named_mock('responsive-margins', Gtk.Frame);
        factory.add_named_mock('results-arrangement',
            Minimal.MinimalArrangement);
        factory.add_named_mock('search-module', SearchModule.SearchModule, {
            'arrangement': 'results-arrangement',
            'card-type': 'results-card',
            'responsive-margins': 'responsive-margins',
        });
        search_module = new SearchModule.SearchModule({
            factory: factory,
            factory_name: 'search-module',
        });
        search_module.show_all();
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

    it('displays the spinner when a search is started', function () {
        search_module.visible_child_name = 'message';
        dispatcher.dispatch({
            action_type: Actions.SEARCH_STARTED,
            query: 'myfoobar',
        });
        expect(search_module.visible_child_name).toBe('spinner');
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
        expect(search_module).not.toHaveCssClass(StyleClasses.NO_RESULTS);
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
        expect(search_module).toHaveCssClass(StyleClasses.NO_RESULTS);
        expect(search_module).toHaveDescendantWithCssClass(StyleClasses.RESULTS_MESSAGE_TITLE);
    });

    it('displays the message page with the error CSS class when the search fails', function () {
        search_module.visible_child_name = 'results';
        dispatcher.dispatch({
            action_type: Actions.SEARCH_FAILED,
            query: 'myfoobar',
            error: new Error(),
        });
        expect(search_module.visible_child_name).toBe('message');
        expect(search_module).toHaveDescendantWithCssClass(StyleClasses.ERROR_MESSAGE);
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

    it('dispatches when an infinite scrolled window arrangement reaches the end', function () {
        const InfiniteArrangement = new Lang.Class({
            Name: 'InfiniteArrangement',
            Extends: InfiniteScrolledWindow.InfiniteScrolledWindow,
            Implements: [ Module.Module, Arrangement.Arrangement ],
            Properties: {
                'factory': GObject.ParamSpec.override('factory', Module.Module),
                'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
            },
            _init: function (props) {
                this.parent(props);
            },
            add_card: function () {},
            get_cards: function () { return []; },
            clear: function () {},
        });

        factory.add_named_mock('infinite-arrangement', InfiniteArrangement);
        factory.add_named_mock('infinite-module', SearchModule.SearchModule, {
            'arrangement': 'infinite-arrangement',
            'card-type': 'results-card',
        });
        search_module = new SearchModule.SearchModule({
            factory: factory,
            factory_name: 'infinite-module',
        });
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
        });
        arrangement.get_cards()[0].emit('clicked');
        Utils.update_gui();
        let payload = dispatcher.last_payload_with_type(Actions.SEARCH_CLICKED);
        let matcher = jasmine.objectContaining({
            model: model,
            context: [ model ],
        });
        expect(payload).toEqual(matcher);
    });
});
