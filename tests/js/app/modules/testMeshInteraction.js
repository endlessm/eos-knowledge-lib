// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ContentObjectModel = imports.search.contentObjectModel;
const MeshInteraction = imports.app.modules.meshInteraction;
const Launcher = imports.app.launcher;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const SetObjectModel = imports.search.setObjectModel;

Gtk.init(null);

const MockHomePage = new Lang.Class({
    Name: 'MockHomePage',
    Extends: GObject.Object,
    Signals: {
        'search-entered': {
            param_types: [GObject.TYPE_STRING],
        },
    },

    _init: function () {
        this.parent();
        this.app_banner = {};
        this._bottom = new MockWidgets.MockItemGroupModule();
    },

    connect: function (signal, handler) {
        // Silently ignore signals that we aren't mocking
        if (GObject.signal_lookup(signal, MockHomePage.$gtype) === 0)
            return;
        this.parent(signal, handler);
    },
});

const MockView = new Lang.Class({
    Name: 'MockView',
    Extends: GObject.Object,
    Signals: {
        'back-clicked': {},
        'forward-clicked': {},
        'search-entered': {
            param_types: [GObject.TYPE_STRING],
        },
    },

    _init: function () {
        this.parent();
        let connectable_object = {
            connect: function () {},
        };
        this.section_page = connectable_object;
        this.section_page.remove_all_cards = function () {};
        this.section_page.append_cards = function () {};
        this.home_page = new MockHomePage();
        this.home_page.tab_button = {};
        this.categories_page = connectable_object;
        this.categories_page.tab_button = {};
        this.article_page = connectable_object;
        this.search_page = connectable_object;
        this.no_search_results_page = {};
        this._visible_page = this.home_page;
    },

    connect: function (signal, handler) {
        // Silently ignore signals that we aren't mocking
        if (GObject.signal_lookup(signal, MockView.$gtype) === 0)
            return;
        this.parent(signal, handler);
    },

    show_page: function (page) {
        this._visible_page = page;
    },
    get_visible_page: function () {
        return this._visible_page;
    },
});

describe('Mesh interaction', function () {
    let mesh, view, engine, factory, sections, dispatcher;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();

        let application = new GObject.Object();
        application.application_id = 'foobar';
        factory = new MockFactory.MockFactory();
        factory.add_named_mock('results-card', Minimal.MinimalCard);
        factory.add_named_mock('document-card', Minimal.MinimalDocumentCard);

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
        engine = new MockEngine.MockEngine();
        engine.get_objects_by_query_finish.and.returnValue([sections.map((section) =>
            new SetObjectModel.SetObjectModel(section)), null]);
        view = new MockView();

        mesh = new MeshInteraction.MeshInteraction({
            application: application,
            factory: factory,
            engine: engine,
            view: view,
        });
        spyOn(mesh, 'record_search_metric');
    });

    it('can be constructed', function () {});

    it('dispatches category models for home page', () => {
        let payloads = dispatcher.dispatched_payloads.filter((payload) => {
            return payload.action_type === Actions.APPEND_SETS;
        });
        expect(payloads.length).toBe(1);
        expect(sections.map((section) => section['title']))
            .toEqual(payloads[0].models.map((model) => model.title));
    });

    it('switches to the correct section page when clicking a card on the home page', function () {
        let model = new ContentObjectModel.ContentObjectModel({
            title: 'An article in a section',
        });
        engine.get_objects_by_query_finish.and.returnValue([[ model ], null]);
        dispatcher.dispatch({
            action_type: Actions.SET_CLICKED,
            model: new SetObjectModel.SetObjectModel(),
        });
        Utils.update_gui();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_SECTION_PAGE)).toBeDefined();
    });

    it('dispatches app-launched on launch from desktop', function () {
        mesh.desktop_launch(0);
        expect(dispatcher.last_payload_with_type(Actions.FIRST_LAUNCH).launch_type)
            .toBe(Launcher.LaunchType.DESKTOP);
    });

    it('dispatches app-launched on launch from search', function () {
        mesh.search(0, 'query');
        expect(dispatcher.last_payload_with_type(Actions.FIRST_LAUNCH).launch_type)
            .toBe(Launcher.LaunchType.SEARCH);
    });

    it('dispatches app-launched on launch from search result', function () {
        engine.get_object_by_id_finish.and.returnValue(new ContentObjectModel.ContentObjectModel());
        mesh.activate_search_result(0, 'ekn://foo/bar', 'query');
        expect(dispatcher.last_payload_with_type(Actions.FIRST_LAUNCH).launch_type)
            .toBe(Launcher.LaunchType.SEARCH_RESULT);
    });

    it('dispatches app-launched only once', function () {
        engine.get_object_by_id_finish.and.returnValue(new ContentObjectModel.ContentObjectModel());

        mesh.desktop_launch(0);
        let payloads = dispatcher.payloads_with_type(Actions.FIRST_LAUNCH);
        expect(payloads.length).toBe(1);

        mesh.desktop_launch(0);
        mesh.search(0, 'query');
        mesh.activate_search_result(0, 'ekn://foo/bar', 'query');

        payloads = dispatcher.payloads_with_type(Actions.FIRST_LAUNCH);
        expect(payloads.length).toBe(1);
    });

    it('indicates that the brand screen has been read after launch from desktop', function () {
        mesh.BRAND_SCREEN_TIME_MS = 0;
        mesh.desktop_launch(0);
        expect(dispatcher.last_payload_with_type(Actions.BRAND_SCREEN_DONE)).not.toBeDefined();
        Utils.update_gui();
        expect(dispatcher.last_payload_with_type(Actions.BRAND_SCREEN_DONE)).toBeDefined();
    });

    it('shows the brand screen only once', function () {
        mesh.BRAND_SCREEN_TIME_MS = 0;
        mesh.desktop_launch(0);
        mesh.desktop_launch(0);
        Utils.update_gui();
        let payloads = dispatcher.payloads_with_type(Actions.BRAND_SCREEN_DONE);
        expect(payloads.length).toBe(1);
    });

    it('does not show the brand screen on other launch methods', function () {
        mesh.BRAND_SCREEN_TIME_MS = 0;
        engine.get_object_by_id_finish.and.returnValue(new ContentObjectModel.ContentObjectModel());
        mesh.search(0, 'query');
        mesh.activate_search_result(0, 'ekn://foo/bar', 'query');
        Utils.update_gui();
        expect(dispatcher.last_payload_with_type(Actions.BRAND_SCREEN_DONE)).not.toBeDefined();
    });

    describe('search', function () {
        beforeEach(function () {
            engine.get_objects_by_query_finish.and.returnValue([[], null]);
        });

        it('occurs after search-entered is dispatched', function () {
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                text: 'query not found',
            });
            expect(engine.get_objects_by_query)
                .toHaveBeenCalledWith(jasmine.objectContaining({
                    query: 'query not found',
                }),
                jasmine.any(Object),
                jasmine.any(Function));
                expect(dispatcher.last_payload_with_type(Actions.SHOW_SEARCH_PAGE)).toBeDefined();
        });

        it('records a metric', function () {
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                text: 'query not found',
            });
            expect(mesh.record_search_metric).toHaveBeenCalled();
        });

        it('dispatches search-failed if the search fails', function () {
            spyOn(window, 'logError');  // silence console output
            engine.get_objects_by_query_finish.and.throwError(new Error('Ugh'));
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                text: 'query not found',
            });
            expect(dispatcher.dispatched_payloads).toContain(jasmine.objectContaining({
                action_type: Actions.SEARCH_FAILED,
                query: 'query not found',
            }));
        });
    });

    describe('history', function () {
        beforeEach(function () {
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
            view.emit('search-entered', 'query not found');
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
