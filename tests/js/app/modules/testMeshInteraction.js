// Copyright 2015 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ContentObjectModel = imports.search.contentObjectModel;
const MeshInteraction = imports.app.modules.meshInteraction;
const Launcher = imports.app.interfaces.launcher;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const SetObjectModel = imports.search.setObjectModel;

Gtk.init(null);

const MockView = new Lang.Class({
    Name: 'MockView',
    Extends: GObject.Object,

    _init: function () {
        this.parent();
    },

    connect: function (signal, handler) {
        // Silently ignore signals that we aren't mocking
        if (GObject.signal_lookup(signal, MockView.$gtype) === 0)
            return;
        this.parent(signal, handler);
    },
});

describe('Mesh interaction', function () {
    let mesh, engine, factory, sections, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        engine = MockEngine.mock_default();

        // Prevent CSS from leaking into other tests
        spyOn(Gtk.StyleContext, 'add_provider_for_screen');

        let application = new GObject.Object();
        application.application_id = 'foobar';
        factory = new MockFactory.MockFactory();

        // The mesh interaction is going to sort these by featured boolean
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
            new SetObjectModel.SetObjectModel(section)), null]);

        factory.add_named_mock('window', MockView);
        factory.add_named_mock('interaction', MeshInteraction.MeshInteraction, {
            'window': 'window',
        });
        mesh = new MeshInteraction.MeshInteraction({
            application: application,
            factory: factory,
            factory_name: 'interaction',
            template_type: 'B',
        });
        mesh.BRAND_PAGE_TIME_MS = 0;
        spyOn(mesh, '_record_search_metric');
    });

    it('can be constructed', function () {});

    it('dispatches category models for home page', () => {
        mesh.desktop_launch(0);
        Utils.update_gui();
        let payloads = dispatcher.dispatched_payloads.filter((payload) => {
            return payload.action_type === Actions.APPEND_SETS;
        });
        expect(payloads.length).toBe(1);
        expect(sections.map((section) => section['title']))
            .toEqual(payloads[0].models.map((model) => model.title));
    });

    it('dispatches present window on launch from desktop', function () {
        mesh.desktop_launch(0);
        Utils.update_gui();
        expect(dispatcher.last_payload_with_type(Actions.PRESENT_WINDOW)).toBeDefined();
    });

    it('dispatches present window on launch from search', function () {
        mesh.search(0, 'query');
        expect(dispatcher.last_payload_with_type(Actions.PRESENT_WINDOW)).toBeDefined();
    });

    it('dispatches present window on launch from search result', function () {
        engine.get_object_by_id_finish.and.returnValue(new ContentObjectModel.ContentObjectModel());
        mesh.activate_search_result(0, 'ekn://foo/bar', 'query');
        expect(dispatcher.last_payload_with_type(Actions.PRESENT_WINDOW)).toBeDefined();
    });

    it('dispatches present window only once', function () {
        engine.get_object_by_id_finish.and.returnValue(new ContentObjectModel.ContentObjectModel());

        mesh.desktop_launch(0);
        Utils.update_gui();
        let payloads = dispatcher.payloads_with_type(Actions.PRESENT_WINDOW);
        expect(payloads.length).toBe(1);

        mesh.desktop_launch(0);
        mesh.search(0, 'query');
        mesh.activate_search_result(0, 'ekn://foo/bar', 'query');

        payloads = dispatcher.payloads_with_type(Actions.PRESENT_WINDOW);
        expect(payloads.length).toBe(1);
    });

    it('shows the brand page until timeout has expired and sets are loaded', function () {
        mesh.desktop_launch(0);
        expect(dispatcher.last_payload_with_type(Actions.SHOW_BRAND_PAGE)).toBeDefined();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).not.toBeDefined();
        Utils.update_gui();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).toBeDefined();
    });

    it('shows the brand page only once', function () {
        mesh.desktop_launch(0);
        mesh.desktop_launch(0);
        Utils.update_gui();
        let payloads = dispatcher.payloads_with_type(Actions.SHOW_BRAND_PAGE);
        expect(payloads.length).toBe(1);
    });

    it('does not show the brand page on other launch methods', function () {
        engine.get_object_by_id_finish.and.returnValue(new ContentObjectModel.ContentObjectModel());
        mesh.search(0, 'query');
        mesh.activate_search_result(0, 'ekn://foo/bar', 'query');
        Utils.update_gui();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_BRAND_PAGE)).not.toBeDefined();
    });

    it('cannot go back from the home page after launch from desktop', function () {
        mesh.desktop_launch(0);
        Utils.update_gui();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).toBeDefined();
        let payload = dispatcher.last_payload_with_type(Actions.HISTORY_BACK_ENABLED_CHANGED);
        expect(!payload || !payload.enabled).toBeTruthy();
    });

    it('cannot go back from the search page after launch from search', function () {
        mesh.search(0, 'query');
        Utils.update_gui();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).not.toBeDefined();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_SEARCH_PAGE)).toBeDefined();
        let payload = dispatcher.last_payload_with_type(Actions.HISTORY_BACK_ENABLED_CHANGED);
        expect(!payload || !payload.enabled).toBeTruthy();
    });

    it('cannot go back from the article page after launch from search result', function () {
        engine.get_object_by_id_finish.and.returnValue(new ContentObjectModel.ContentObjectModel());
        mesh.activate_search_result(0, 'ekn://foo/bar', 'query');
        Utils.update_gui();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).not.toBeDefined();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_ARTICLE_PAGE)).toBeDefined();
        let payload = dispatcher.last_payload_with_type(Actions.HISTORY_BACK_ENABLED_CHANGED);
        expect(!payload || !payload.enabled).toBeTruthy();
    });

    it('goes back to the home page via the sidebar after launch from search', function () {
        mesh.search(0, 'query');
        Utils.update_gui();
        dispatcher.reset();
        dispatcher.dispatch({
            action_type: Actions.NAV_BACK_CLICKED,
        });
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).toBeDefined();
    });

    it('goes back to the home page via the sidebar after launch from search result', function () {
        engine.get_object_by_id_finish.and.returnValue(new ContentObjectModel.ContentObjectModel());
        mesh.activate_search_result(0, 'ekn://foo/bar', 'query');
        Utils.update_gui();
        dispatcher.reset();
        dispatcher.dispatch({
            action_type: Actions.NAV_BACK_CLICKED,
        });
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).toBeDefined();
    });

    it('goes back to the home page when home button is clicked', function () {
        dispatcher.dispatch({
            action_type: Actions.HOME_CLICKED,
        });
        Utils.update_gui();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).toBeDefined();
    });

    describe('on set click', function () {
        let article_model, set_model;
        beforeEach(function () {
            article_model = new ContentObjectModel.ContentObjectModel({
                ekn_id: 'ekn://foo/bar',
            });
            set_model = new SetObjectModel.SetObjectModel({
                ekn_id: 'ekn://foo/set',
            });
            engine.get_objects_by_query_finish.and.returnValue([[article_model], null]);
        });

        it('shows the section page after engine query returns', function () {
            engine.get_objects_by_query.and.stub();
            dispatcher.dispatch({
                action_type: Actions.SET_CLICKED,
                model: set_model,
            });
            expect(dispatcher.last_payload_with_type(Actions.SHOW_SECTION_PAGE)).not.toBeDefined();
            let callback = engine.get_objects_by_query.calls.mostRecent().args[2];
            callback(engine);
            expect(dispatcher.last_payload_with_type(Actions.SHOW_SECTION_PAGE)).toBeDefined();
        });

        it('shows the set', function () {
            dispatcher.dispatch({
                action_type: Actions.SET_CLICKED,
                model: set_model,
            });
            let payload = dispatcher.last_payload_with_type(Actions.SHOW_SET);
            expect(payload.model).toBe(set_model);
        });

        it('loads the set items from engine', function () {
            dispatcher.dispatch({
                action_type: Actions.SET_CLICKED,
                model: set_model,
            });
            expect(dispatcher.has_payload_sequence([
                Actions.CLEAR_ITEMS,
                Actions.APPEND_ITEMS,
                Actions.SET_READY
            ])).toBe(true);
            let payload = dispatcher.last_payload_with_type(Actions.APPEND_ITEMS);
            expect(payload.models).toEqual([ article_model ]);
        });

        it('cancels existing set queries', function () {
            engine.get_objects_by_query.and.stub();
            dispatcher.dispatch({
                action_type: Actions.SET_CLICKED,
                model: set_model,
            });
            let cancellable = engine.get_objects_by_query.calls.mostRecent().args[1];
            let cancel_spy = jasmine.createSpy();
            cancellable.connect(cancel_spy);
            dispatcher.dispatch({
                action_type: Actions.SET_CLICKED,
                model: new SetObjectModel.SetObjectModel({
                    ekn_id: 'ekn://foo/otherset',
                }),
            });
            expect(cancel_spy).toHaveBeenCalled();
        });
    });

    describe('on search entered', function () {
        let article_model, query;
        beforeEach(function () {
            article_model = new ContentObjectModel.ContentObjectModel({
                ekn_id: 'ekn://foo/bar',
            });
            query = 'foo';
            engine.get_objects_by_query_finish.and.returnValue([[article_model], null]);
        });

        it('queries the engine', function () {
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                query: query,
            });
            expect(engine.get_objects_by_query)
                .toHaveBeenCalledWith(jasmine.objectContaining({
                    query: query,
                }),
                jasmine.any(Object),
                jasmine.any(Function));
        });

        it('show the search page', function () {
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                query: query,
            });
            expect(dispatcher.last_payload_with_type(Actions.SHOW_SEARCH_PAGE)).toBeDefined();
        });

        it('records a metric', function () {
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                query: query,
            });
            expect(mesh._record_search_metric).toHaveBeenCalled();
        });

        it('loads the results from engine', function () {
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                query: query,
            });
            expect(dispatcher.has_payload_sequence([
                Actions.SEARCH_STARTED,
                Actions.CLEAR_SEARCH,
                Actions.APPEND_SEARCH,
                Actions.SEARCH_READY
            ])).toBe(true);
            let payload = dispatcher.last_payload_with_type(Actions.APPEND_SEARCH);
            expect(payload.models).toEqual([ article_model ]);
        });

        it('dispatches search-failed if the search fails', function () {
            spyOn(window, 'logError');  // silence console output
            engine.get_objects_by_query_finish.and.throwError(new Error('Ugh'));
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                query: query,
            });
            expect(dispatcher.dispatched_payloads).toContain(jasmine.objectContaining({
                action_type: Actions.SEARCH_FAILED,
                query: query,
            }));
        });

        it('cancels existing search queries', function () {
            engine.get_objects_by_query.and.stub();
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                query: query,
            });
            let cancellable = engine.get_objects_by_query.calls.mostRecent().args[1];
            let cancel_spy = jasmine.createSpy();
            cancellable.connect(cancel_spy);
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                query: 'bar',
            });
            expect(cancel_spy).toHaveBeenCalled();
        });
    });

    describe('on article selected', function () {
        let article_model;
        beforeEach(function () {
            article_model = new ContentObjectModel.ContentObjectModel({
                ekn_id: 'ekn://foo/bar',
            });
        });

        it('shows the article page', function () {
            dispatcher.dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: article_model,
            });
            expect(dispatcher.last_payload_with_type(Actions.SHOW_ARTICLE_PAGE)).toBeDefined();
        });

        it('shows the article without animation when first loading the page', function () {
            dispatcher.dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: article_model,
            });
            let payload = dispatcher.last_payload_with_type(Actions.SHOW_ARTICLE);
            expect(payload.model).toBe(article_model);
            expect(payload.animation_type).toBe(EosKnowledgePrivate.LoadingAnimationType.NONE);
        });

        it('loads the article list', function () {
            engine.get_objects_by_query_finish.and.returnValue([[ article_model ], null]);
            dispatcher.dispatch({
                action_type: Actions.AUTOCOMPLETE_CLICKED,
                model: article_model,
                query: 'foo',
            });
            let payload = dispatcher.last_payload_with_type(Actions.APPEND_SEARCH);
            expect(payload.models).toEqual([ article_model ]);
        });
    });

    describe('history', function () {
        beforeEach(function () {
            mesh.desktop_launch(0);
            engine.get_objects_by_query_finish.and.returnValue([[
                new ContentObjectModel.ContentObjectModel({
                    title: 'An article in a section',
                }),
            ], null]);
            dispatcher.dispatch({
                action_type: Actions.SET_CLICKED,
                model: new SetObjectModel.SetObjectModel({
                    child_tags: ['some-tag'],
                }),
            });
            Utils.update_gui();
        });

        it('puts the right articles in a set', function () {
            let query_object = engine.get_objects_by_query.calls.mostRecent().args[0];
            expect(query_object.tags).toEqual(['some-tag']);
        });

        it('leads back to the home page', function () {
            dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
            Utils.update_gui();
            expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).toBeDefined();
        });

        it('leads back to the section page', function () {
            dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
            Utils.update_gui();
            expect(dispatcher.last_payload_with_type(Actions.SHOW_SECTION_PAGE)).toBeDefined();
        });

        it('leads forward to the section page', function () {
            dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
            Utils.update_gui();
            dispatcher.dispatch({ action_type: Actions.HISTORY_FORWARD_CLICKED });
            Utils.update_gui();
            expect(dispatcher.last_payload_with_type(Actions.SHOW_SECTION_PAGE)).toBeDefined();
        });
    });
});
