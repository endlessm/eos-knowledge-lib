// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const AppUtils = imports.app.utils;
const ContentObjectModel = imports.search.contentObjectModel;
const HistoryStore = imports.app.historyStore;
const Mesh = imports.app.modules.controller.mesh;
const Knowledge = imports.app.knowledge;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const Pages = imports.app.pages;
const SetObjectModel = imports.search.setObjectModel;

Gtk.init(null);

const MockView = new Knowledge.Class({
    Name: 'MockView',
    Extends: GObject.Object,

    _init: function (props) {
        void props;  // Silently ignore properties
        this.parent();
    },

    connect: function (signal, handler) {
        // Silently ignore signals that we aren't mocking
        if (GObject.signal_lookup(signal, MockView.$gtype) === 0)
            return;
        this.parent(signal, handler);
    },

    make_ready: function (cb=function () {}) {
        cb();
    },

    get_style_context: function () {
        return {
            add_class: function () {},
        };
    },
});

describe('Controller.Mesh', function () {
    let mesh, engine, factory, sections, dispatcher, store;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        engine = MockEngine.mock_default();

        let application = new GObject.Object();
        application.application_id = 'foobar';

        // The mesh controller is going to sort these by featured boolean
        // so make sure they are ordered with featured ones first otherwise
        // test will fail.
        sections = [
            {
                title: 'Kings',
                thumbnail_uri: 'resource:///com/endlessm/thrones/joffrey.jpg',
                featured: true,
                child_tags: ['hostels', 'monuments'],
            },
            {
                title: 'Whitewalkers',
                thumbnail_uri: 'resource:///com/endlessm/thrones/whitewalker.jpg',
                tags: ['EknHomePageTag'],
                child_tags: ['asia', 'latin america'],
            },
            {
                title: 'Weddings',
                thumbnail_uri: 'resource:///com/endlessm/thrones/red_wedding.jpg',
                child_tags: ['countries', 'monuments', 'mountains'],
            },
        ];
        engine.get_objects_by_query_finish.and.returnValue([sections.map((section) =>
            new SetObjectModel.SetObjectModel(section)),
            {
                more_results: null,
            }]);

        [mesh, factory] = MockFactory.setup_tree({
            type: Mesh.Mesh,
            properties: {
                'application': application,
                'template-type': 'B',
                'theme': '',
            },
            slots: {
                'window': { type: MockView },
            },
        });
        store = HistoryStore.get_default();
        mesh.BRAND_PAGE_TIME_MS = 0;
        mesh.make_ready();
        spyOn(AppUtils, 'record_search_metric');
    });

    it('shows the brand page until timeout has expired and sets are loaded', function () {
        store.set_current_item_from_props({
            page_type: Pages.HOME,
        });
        expect(dispatcher.last_payload_with_type(Actions.SHOW_BRAND_PAGE)).toBeDefined();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).not.toBeDefined();
        Utils.update_gui();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).toBeDefined();
    });

    it('shows the brand page only once', function () {
        store.set_current_item_from_props({
            page_type: Pages.HOME,
            timestamp: 0,
        });
        store.set_current_item_from_props({
            page_type: Pages.HOME,
            timestamp: 1,
        });
        let payloads = dispatcher.payloads_with_type(Actions.SHOW_BRAND_PAGE);
        expect(payloads.length).toBe(1);
    });

    it('does not show the brand page on other launch methods', function () {
        store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
            model: new ContentObjectModel.ContentObjectModel(),
        });
        expect(dispatcher.last_payload_with_type(Actions.SHOW_BRAND_PAGE)).not.toBeDefined();
    });

    it('goes back to the home page when state changes to home page', function () {
        store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
        });
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).not.toBeDefined();
        store.set_current_item_from_props({
            page_type: Pages.HOME,
        });
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).toBeDefined();
    });

    describe('on state change to set page', function () {
        let article_model, set_model;
        beforeEach(function () {
            article_model = new ContentObjectModel.ContentObjectModel({
                ekn_id: 'ekn://foo/bar',
            });
            set_model = new SetObjectModel.SetObjectModel({
                ekn_id: 'ekn://foo/set',
            });
            engine.get_objects_by_query_finish.and.returnValue([[article_model], {
                more_results: null,
            }]);
            store.set_current_item_from_props({
                page_type: Pages.SET,
                model: set_model,
            });
        });

        it('shows the set page after engine query returns', function () {
            dispatcher.reset();
            let callback = engine.get_objects_by_query.calls.mostRecent().args[2];
            callback(engine);
            expect(dispatcher.last_payload_with_type(Actions.SHOW_SET_PAGE)).toBeDefined();
        });

        it('shows the set', function () {
            let payload = dispatcher.last_payload_with_type(Actions.SHOW_SET);
            expect(payload.model).toBe(set_model);
        });

        it('cancels existing set queries', function () {
            let cancellable = engine.get_objects_by_query.calls.mostRecent().args[1];
            let cancel_spy = jasmine.createSpy();
            cancellable.connect(cancel_spy);
            store.set_current_item_from_props({
                page_type: Pages.SET,
                model: new SetObjectModel.SetObjectModel({
                    ekn_id: 'ekn://foo/otherset',
                }),
            });
            expect(cancel_spy).toHaveBeenCalled();
        });
    });

    describe('on state change to search', function () {
        let article_model;
        beforeEach(function () {
            article_model = new ContentObjectModel.ContentObjectModel({
                ekn_id: 'ekn://foo/bar',
            });
            engine.get_objects_by_query_finish.and.returnValue([[article_model], {
                more_results: null,
            }]);
            store.set_current_item_from_props({
                page_type: Pages.SEARCH,
                query: 'foo',
            });
        });

        it('queries the engine', function () {
            expect(engine.get_objects_by_query)
                .toHaveBeenCalledWith(jasmine.objectContaining({
                    query: 'foo',
                }),
                jasmine.any(Object),
                jasmine.any(Function));
        });

        it('shows the search page', function () {
            expect(dispatcher.last_payload_with_type(Actions.SHOW_SEARCH_PAGE)).toBeDefined();
        });

        it('dispatches search started before showing the search page', function () {
            let payload_actions = dispatcher.dispatched_payloads.map((payload) => payload.action_type);
            let started_index = payload_actions.indexOf(Actions.SEARCH_STARTED);
            let show_page_index = payload_actions.indexOf(Actions.SHOW_SEARCH_PAGE);
            expect(started_index).not.toBe(-1);
            expect(show_page_index).not.toBe(-1);
            expect(started_index).toBeLessThan(show_page_index);
        });

        it('dispatches search-started and search-ready in order', function () {
            expect(dispatcher.has_payload_sequence([
                Actions.SEARCH_STARTED,
                Actions.SEARCH_READY,
            ])).toBe(true);
        });
    });

    it('dispatches search-failed if the search fails', function () {
        spyOn(window, 'logError');  // silence console output
        engine.get_objects_by_query_finish.and.throwError(new Error('Ugh'));
        store.set_current_item_from_props({
            page_type: Pages.SEARCH,
            query: 'foo',
        });
        expect(dispatcher.last_payload_with_type(Actions.SEARCH_FAILED))
            .toEqual(jasmine.objectContaining({ query: 'foo' }));
    });

    it('cancels existing search queries', function () {
        engine.get_objects_by_query.and.stub();
        store.set_current_item_from_props({
            page_type: Pages.SEARCH,
            query: 'foo',
        });
        let cancellable = engine.get_objects_by_query.calls.mostRecent().args[1];
        let cancel_spy = jasmine.createSpy();
        cancellable.connect(cancel_spy);
        store.set_current_item_from_props({
            page_type: Pages.SEARCH,
            query: 'bar',
        });
        expect(cancel_spy).toHaveBeenCalled();
    });

    describe('on state change to article page', function () {
        let article_model;
        beforeEach(function () {
            article_model = new ContentObjectModel.ContentObjectModel({
                ekn_id: 'ekn://foo/bar',
            });
            store.set_current_item_from_props({
                page_type: Pages.ARTICLE,
                model: article_model,
            });
        });

        it('shows the article page', function () {
            expect(dispatcher.last_payload_with_type(Actions.SHOW_ARTICLE_PAGE)).toBeDefined();
        });
    });

    it('makes queries for set objects with the correct tags', function () {
        store.set_current_item_from_props({
            page_type: Pages.SET,
            model: new SetObjectModel.SetObjectModel({
                child_tags: ['some-tag'],
            }),
        });
        let query_object = engine.get_objects_by_query.calls.mostRecent().args[0];
        expect(query_object.tags_match_any).toEqual(['some-tag']);
    });
});
