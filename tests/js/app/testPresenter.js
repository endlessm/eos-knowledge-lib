const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const ContentObjectModel = imports.search.contentObjectModel;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const MockLightbox = imports.tests.mockLightbox;
const MockWidgets = imports.tests.mockWidgets;
const Presenter = imports.app.presenter;

Gtk.init(null);

const TEST_CONTENT_DIR = Utils.get_test_content_srcdir();

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
        this.lightbox = new MockLightbox.MockLightbox();
        this.search_page = connectable_object;
        this.no_search_results_page = {};
    },

    connect: function (signal, handler) {
        // Silently ignore signals that we aren't mocking
        if (GObject.signal_lookup(signal, MockView.$gtype) === 0)
            return;
        this.parent(signal, handler);
    },

    show_page: function (page) {},
    lock_ui: function () {},
    unlock_ui: function () {},
    present_with_time: function () {},
});

describe('Presenter', () => {
    let presenter, data, view, engine, factory, sections, dispatcher;
    let test_app_filename = TEST_CONTENT_DIR + 'app.json';

    beforeEach(() => {
        dispatcher = MockDispatcher.mock_default();

        factory = new MockFactory.MockFactory();
        factory.add_named_mock('home-card', Minimal.MinimalCard);
        factory.add_named_mock('results-card', Minimal.MinimalCard);

        // FIXME: this is a v1 app.json
        data = Utils.parse_object_from_path(test_app_filename);
        data['styles'] = {};

        sections = [
            {
                title: 'Whitewalkers',
                thumbnail_uri: 'resource:///com/endlessm/thrones/whitewalker.jpg',
                tags: ['home page', 'asia', 'latin america'],
            },
            {
                title: 'Kings',
                thumbnail_uri: 'resource:///com/endlessm/thrones/joffrey.jpg',
                featured: true,
                tags: ['hostels', 'monuments'],
            },
            {
                title: 'Weddings',
                thumbnail_uri: 'resource:///com/endlessm/thrones/red_wedding.jpg',
                tags: ['countries', 'monuments', 'mountains'],
            },
        ];

        view = new MockView();
        spyOn(view, 'show_page');
        engine = new MockEngine.MockEngine();
        engine.get_objects_by_query_finish.and.returnValue([sections.map((section) =>
            new ContentObjectModel.ContentObjectModel(section)), null]);
        let application = new GObject.Object();
        application.application_id = 'foobar';
        presenter = new Presenter.Presenter(data, {
            application: application,
            factory: factory,
            engine: engine,
            view: view,
        });
        spyOn(presenter, 'record_search_metric');
    });

    it('can be constructed', () => {});

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
            action_type: Actions.SET_SELECTED,
            model: new ContentObjectModel.ContentObjectModel(),
        });
        Utils.update_gui();
        expect(view.show_page).toHaveBeenCalledWith(view.section_page);
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
            expect(view.show_page).toHaveBeenCalledWith(view.no_search_results_page);
        });

        it('records a metric', function () {
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                text: 'query not found',
            });
            expect(presenter.record_search_metric).toHaveBeenCalled();
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
                action_type: Actions.SET_SELECTED,
                model: new ContentObjectModel.ContentObjectModel(),
            });
            Utils.update_gui();
        });

        it('leads back to the home page', function () {
            dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
            Utils.update_gui();
            expect(view.show_page).toHaveBeenCalledWith(view.home_page);
        });

        it('leads back to the section page', function () {
            view.emit('search-entered', 'query not found');
            dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
            Utils.update_gui();
            expect(view.show_page).toHaveBeenCalledWith(view.section_page);
        });

        it('leads forward to the section page', function () {
            dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
            Utils.update_gui();
            dispatcher.dispatch({ action_type: Actions.HISTORY_FORWARD_CLICKED });
            Utils.update_gui();
            expect(view.show_page).toHaveBeenCalledWith(view.section_page);
        });
    });
});
