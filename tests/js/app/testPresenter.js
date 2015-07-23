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
        this.search_box = new MockWidgets.MockSearchBox();
        this.app_banner = {};
    },

    get_submodule: function () {
        return new MockWidgets.MockItemGroup();
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
        this.section_page.remove_all_segments = function () {};
        this.section_page.append_to_segment = function () {};
        this.home_page = new MockHomePage();
        this.home_page.tab_button = {};
        this.categories_page = connectable_object;
        this.categories_page.tab_button = {};
        this.article_page = connectable_object;
        this.lightbox = new GObject.Object();
        this.search_box = new MockWidgets.MockSearchBox();
        this.no_search_results_page = {};
        this.history_buttons = new MockWidgets.MockHistoryButtons();
        this.history_buttons.back_button.connect('clicked', function () {
            this.emit('back-clicked');
        }.bind(this));
        this.history_buttons.forward_button.connect('clicked', function () {
            this.emit('forward-clicked');
        }.bind(this));
    },

    connect: function (signal, handler) {
        // Silently ignore signals that we aren't mocking
        if (GObject.signal_lookup(signal, MockView.$gtype) === 0)
            return;
        this.parent(signal, handler);
    },

    show_article_page: function () {},
    show_no_search_results_page: function () {},
    show_section_page: function () {},
    show_home_page: function () {},
    lock_ui: function () {},
    unlock_ui: function () {},
    present_with_time: function () {},
});

const MockArticlePresenter = new Lang.Class({
    Name: 'MockArticlePresenter',
    Extends: GObject.Object,

    _init: function () {
        this.parent();
    },

    connect: function () {},
});

describe('Presenter', () => {
    let presenter, data, view, engine, article_presenter, factory, sections, dispatcher;
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
        engine = new MockEngine.MockEngine();
        engine.get_objects_by_query_finish.and.returnValue([sections.map((section) =>
            new ContentObjectModel.ContentObjectModel(section)), null]);
        article_presenter = new MockArticlePresenter();
        let application = new GObject.Object();
        application.application_id = 'foobar';
        presenter = new Presenter.Presenter(data, {
            application: application,
            factory: factory,
            article_presenter: article_presenter,
            engine: engine,
            view: view,
        });
        spyOn(presenter, 'record_search_metric');
    });

    it('can be constructed', () => {});

    it('puts the correct cards on the home page', () => {
        expect(sections.map((section) => section['title']))
            .toEqual(view.home_page.cards.map((card) => card.model.title));

        expect(sections.map((section) => section['thumbnail_uri']))
            .toEqual(view.home_page.cards.map((card) => card.model.thumbnail_uri));

        expect(sections.map((section) => !!section['featured']))
            .toEqual(view.home_page.cards.map((card) => card.model.featured));
    });

    it('switches to the correct section page when clicking a card on the home page', function () {
        spyOn(view, 'show_section_page');
        engine.get_objects_by_query_finish.and.returnValue([[
            new ContentObjectModel.ContentObjectModel({
                title: 'An article in a section',
            }),
        ], null]);
        view.home_page.cards[0].emit('clicked');
        Utils.update_gui();
        expect(view.show_section_page).toHaveBeenCalled();
    });

    describe('searching from search box', function () {
        beforeEach(function () {
            spyOn(view, 'show_no_search_results_page');
            engine.get_objects_by_query_finish.and.returnValue([[], null]);
        });

        it('works from the title bar', function (done) {
            view.emit('search-entered', 'query not found');
            Mainloop.idle_add(function () {
                expect(engine.get_objects_by_query)
                    .toHaveBeenCalledWith(jasmine.objectContaining({
                        query: 'query not found',
                    }),
                    jasmine.any(Object),
                    jasmine.any(Function));
                expect(view.show_no_search_results_page).toHaveBeenCalled();
                done();
                return GLib.SOURCE_REMOVE;
            });
        });

        it('works from the home page', function (done) {
            view.home_page.emit('search-entered', 'query not found');
            Mainloop.idle_add(function () {
                expect(engine.get_objects_by_query)
                    .toHaveBeenCalledWith(jasmine.objectContaining({
                        query: 'query not found',
                    }),
                    jasmine.any(Object),
                    jasmine.any(Function));
                expect(view.show_no_search_results_page).toHaveBeenCalled();
                done();
                return GLib.SOURCE_REMOVE;
            });
        });

        it('records a metric when you search from the title bar', function (done) {
            view.emit('search-entered', 'query not found');
            Mainloop.idle_add(function () {
                expect(presenter.record_search_metric).toHaveBeenCalled();
                done();
                return GLib.SOURCE_REMOVE;
            });
        });

        it('records a metric when you search from the home page', function (done) {
            view.home_page.emit('search-entered', 'query not found');
            Mainloop.idle_add(function () {
                expect(presenter.record_search_metric).toHaveBeenCalled();
                done();
                return GLib.SOURCE_REMOVE;
            });
        });
    });

    describe('history', function () {
        beforeEach(function () {
            engine.get_objects_by_query_finish.and.returnValue([[
                new ContentObjectModel.ContentObjectModel({
                    title: 'An article in a section',
                }),
            ], null]);
            view.home_page.cards[0].emit('clicked');
            Utils.update_gui();
        });

        it('leads back to the home page', function () {
            spyOn(view, 'show_home_page');
            dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
            Utils.update_gui();
            expect(view.show_home_page).toHaveBeenCalled();
        });

        it('leads back to the section page', function () {
            view.emit('search-entered', 'query not found');
            spyOn(view, 'show_section_page');
            dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
            Utils.update_gui();
            expect(view.show_section_page).toHaveBeenCalled();
        });

        it('leads forward to the section page', function () {
            dispatcher.dispatch({ action_type: Actions.HISTORY_BACK_CLICKED });
            Utils.update_gui();
            spyOn(view, 'show_section_page');
            dispatcher.dispatch({ action_type: Actions.HISTORY_FORWARD_CLICKED });
            Utils.update_gui();
            expect(view.show_section_page).toHaveBeenCalled();
        });
    });
});
