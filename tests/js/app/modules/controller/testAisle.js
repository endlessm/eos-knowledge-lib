// Copyright 2015 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Mainloop = imports.mainloop;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const Aisle = imports.app.modules.controller.aisle;
const AppUtils = imports.app.utils;
const ArticleObjectModel = imports.search.articleObjectModel;
const Knowledge = imports.app.knowledge;
const Launcher = imports.app.interfaces.launcher;
const Minimal = imports.tests.minimal;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const MockWidgets = imports.tests.mockWidgets;
const QueryObject = imports.search.queryObject;

Gtk.init(null);

const UPDATE_INTERVAL_MS = 604800000;

const MockApplication = new Knowledge.Class({
    Name: 'MockApplication',
    Extends: GObject.Object,
    application_id: 'com.endlessm.EosKnowledgePrivate.testAisleController',
});

const MockUserSettingsModel = new Knowledge.Class({
    Name: 'MockUserSettingsModel',
    Extends: GObject.Object,
    Properties: {
        'highest-article-read': GObject.ParamSpec.uint('highest-article-read', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 0),
        'start-article': GObject.ParamSpec.uint('start-article', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 0),
        'bookmark-page': GObject.ParamSpec.uint('bookmark-page', '', '',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            0, GLib.MAXUINT32, 0),
        'update-timestamp': GObject.ParamSpec.string('update-timestamp', 'Last Update Time',
            'Last time content was updated',
            GObject.ParamFlags.READWRITE, ''),
    },
});

const MockNavButtons = new Knowledge.Class({
    Name: 'MockNavButtons',
    Extends: GObject.Object,
    Properties: {
        'back-visible': GObject.ParamSpec.boolean('back-visible', '', '',
            GObject.ParamFlags.READWRITE, true),
    },
});

let get_style_context = function () {
    return {
        add_class: function () {},
    };
};

const MockView = new Knowledge.Class({
    Name: 'MockView',
    GTypeName: 'MockView_TestAisleController',
    Extends: GObject.Object,
    Signals: {
        'debug-hotkey-pressed': {},
    },

    _init: function () {
        this.parent();
        this.nav_buttons = new MockNavButtons();
        this.issue_nav_buttons = {
            back_button: new MockWidgets.MockButton(),
            forward_button: new MockWidgets.MockButton(),
            show: jasmine.createSpy('show'),
        };

        this.back_cover = {
            get_style_context: get_style_context,
        };
        this.overview_page = {
            get_style_context: get_style_context,
            app_banner: {},
        };

        this.total_pages = 0;
        this._article_pages = [];
        this.page_manager = {
            add: function () {},
        };
    },

    present_with_time: function () {},
    present: function () {},
    show_all: function () {},
    append_article_page: function (model) {
        this._article_pages.push(new Minimal.MinimalDocumentCard({
            model: model,
        }));
    },
    get_article_page: function (i) {
        return this._article_pages[i];
    },
    article_pages_visible: function () {
        return true;
    },
    remove_all_article_pages: function () {
        this._article_pages = [];
    },
});

describe('Aisle controller', function () {
    let engine, settings, view, controller, dispatcher;

    const MOCK_DATA = [
        ['Title 1', ['Kim Kardashian'], '2014/11/13 08:00'],
        ['Title 2', ['Kim Kardashian'], ''],
        ['Title 3', [],                 '2014/11/13 08:00'],
        ['Title 4', [],                 ''],
    ];
    const MOCK_RESULTS = MOCK_DATA.map((data, ix) => {
        let model = new ArticleObjectModel.ArticleObjectModel ({
            title: data[0],
            synopsis: "Some text",
            ekn_id: 'about:blank',
            published: data[2],
            article_number: ix,
            authors: data[1],
        });
        return model;
    });

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        engine = MockEngine.mock_default();

        spyOn(AppUtils, 'get_web_plugin_dbus_name').and.returnValue('test0');
        // Prevent CSS from leaking into other tests
        spyOn(Gtk.StyleContext, 'add_provider_for_screen');


        let application = new MockApplication();
        settings = new MockUserSettingsModel({
            highest_article_read: 0,
            bookmark_page: 0,
            start_article: 0,
            update_timestamp: new Date().toISOString(),
        });
        engine.get_objects_by_query_finish.and.returnValue([[], null]);
        engine.get_object_by_id_finish.and.returnValue(null);

        let factory = new MockFactory.MockFactory();
        factory.add_named_mock('window', MockView);
        factory.add_named_mock('controller', Aisle.Aisle, {
            'window': 'window',
        }, {
            application: application,
            settings: settings,
        });

        controller = factory.create_named_module('controller');
        view = factory.get_created_named_mocks('window')[0];
        spyOn(controller, 'record_search_metric');
    });

    it('constructs', function () {});

    describe('launch process', function () {
        beforeEach(function () {
            engine.get_objects_by_query_finish.and.returnValue([MOCK_RESULTS, null]);
        });

        it('queries the articles in the initial article set', function () {
            controller.desktop_launch();
            expect(engine.get_objects_by_query).toHaveBeenCalledWith(
                jasmine.objectContaining({
                    limit: 15,
                    sort: QueryObject.QueryObjectSort.ARTICLE_NUMBER,
                    order: QueryObject.QueryObjectOrder.ASCENDING,
                    tags: ['EknArticleObject'],
                    offset: 0,
                }),
                jasmine.any(Object),
                jasmine.any(Function));
        });

        it('adds the articles as pages', function () {
            spyOn(view, 'append_article_page').and.callThrough();
            controller.desktop_launch();
            expect(view.append_article_page.calls.count()).toEqual(MOCK_RESULTS.length);
        });

        it('shows the snippets on the front cover when loading content', function () {
            controller.desktop_launch();
            expect(dispatcher.last_payload_with_type(Actions.CLEAR_ITEMS)).toBeDefined();
            expect(dispatcher.last_payload_with_type(Actions.APPEND_ITEMS).models).toEqual(jasmine.any(Array));
        });

        it('gracefully handles the query failing', function () {
            spyOn(window, 'logError');
            engine.get_objects_by_query_finish.and.callFake(function () {
                throw new Error();
            });
            expect(function () {
                controller.desktop_launch();
            }).not.toThrow();
        });

        it('dispatches appropriately when launched with an archived search result', function () {
            const MOCK_ID = 'abc123';
            let model = new ArticleObjectModel.ArticleObjectModel({
                article_number: 5000,
                ekn_id: 'about:blank',
                title: 'I Write a Blog',
            });
            engine.get_object_by_id_finish.and.returnValue(model);
            controller.activate_search_result(0, MOCK_ID, 'fake query');
            expect(engine.get_object_by_id).toHaveBeenCalledWith(MOCK_ID,
                                                                 jasmine.any(Object),
                                                                 jasmine.any(Function));
            expect(dispatcher.last_payload_with_type(Actions.SHOW_STANDALONE_PAGE))
                .toEqual(jasmine.objectContaining({ model: model }));
        });

        it('starts at the right page when search result is in this issue', function () {
            engine.get_object_by_id_finish.and.returnValue(MOCK_RESULTS[2]);
            controller.activate_search_result(0, 'abc2134', 'fake query');
            expect(controller.current_page).toBe(3);
        });

        it('dispatches app-launched on launch from desktop', function () {
            controller.desktop_launch(0);
            expect(dispatcher.last_payload_with_type(Actions.PRESENT_WINDOW).launch_type)
                .toBe(Launcher.LaunchType.DESKTOP);
        });

        it('dispatches app-launched on launch from search', function () {
            controller.search(0, 'query');
            expect(dispatcher.last_payload_with_type(Actions.PRESENT_WINDOW).launch_type)
                .toBe(Launcher.LaunchType.SEARCH);
        });

        it('dispatches app-launched on launch from search result', function () {
            engine.get_object_by_id_finish.and.returnValue(new ArticleObjectModel.ArticleObjectModel());
            controller.activate_search_result(0, 'ekn://foo/bar', 'query');
            expect(dispatcher.last_payload_with_type(Actions.PRESENT_WINDOW).launch_type)
                .toBe(Launcher.LaunchType.SEARCH_RESULT);
        });
    });

    describe('object', function () {
        let current_time = new Date().toISOString();

        beforeEach(function () {
            engine.get_objects_by_query_finish.and.returnValue([MOCK_RESULTS, null]);
            view.total_pages = MOCK_RESULTS.length + 2;
            controller.desktop_launch();
        });

        it('starts on the first page', function () {
            expect(controller.current_page).toBe(0);
        });

        it('increments the current page when clicking the forward button', function () {
            dispatcher.dispatch({ action_type: Actions.NAV_FORWARD_CLICKED });
            expect(controller.history_model.current_item.model.title).toBe('Title 1');
            expect(controller.current_page).toBe(1);
            expect(settings.bookmark_page).toBe(1);
        });

        it('decrements the current page when clicking the back button', function () {
            dispatcher.dispatch({ action_type: Actions.NAV_FORWARD_CLICKED });
            dispatcher.dispatch({ action_type: Actions.NAV_BACK_CLICKED });
            expect(controller.current_page).toBe(0);
            expect(settings.bookmark_page).toBe(0);
        });

        it('tells the view to go to the overview page', function () {
            controller._go_to_page(5);
            controller._go_to_page(0);
            expect(dispatcher.last_payload_with_type(Actions.SHOW_FRONT_PAGE)).toBeDefined();
        });

        it('tells the view to go to the done page', function () {
            controller._go_to_page(view.total_pages - 1);
            expect(dispatcher.last_payload_with_type(Actions.SHOW_BACK_PAGE)).toBeDefined();
        });

        it('goes to the done page when paging forward on the last article page', function () {
            controller._go_to_page(view.total_pages - 2);
            dispatcher.dispatch({ action_type: Actions.NAV_FORWARD_CLICKED });
            expect(dispatcher.last_payload_with_type(Actions.SHOW_BACK_PAGE)).toBeDefined();
        });

        it('goes back to the front page when home button is clicked', function () {
            controller._add_history_item_for_page(5);
            dispatcher.dispatch({ action_type: Actions.HOME_CLICKED });
            expect(dispatcher.last_payload_with_type(Actions.SHOW_FRONT_PAGE)).toBeDefined();
        });

        it('tells the view to animate forward when going to a later page', function () {
            controller._go_to_page(1, EosKnowledgePrivate.LoadingAnimationType.FORWARDS_NAVIGATION);
            let payload = dispatcher.last_payload_with_type(Actions.SHOW_ARTICLE_PAGE);
            expect(payload.index).toBe(0);
            expect(payload.animation_type).toBe(EosKnowledgePrivate.LoadingAnimationType.FORWARDS_NAVIGATION);
        });

        it('tells the view to animate backward when going to an earlier page', function () {
            controller._go_to_page(3, EosKnowledgePrivate.LoadingAnimationType.FORWARDS_NAVIGATION);
            controller._go_to_page(2, EosKnowledgePrivate.LoadingAnimationType.BACKWARDS_NAVIGATION);
            let payload = dispatcher.last_payload_with_type(Actions.SHOW_ARTICLE_PAGE);
            expect(payload.index).toBe(1);
            expect(payload.animation_type).toBe(EosKnowledgePrivate.LoadingAnimationType.BACKWARDS_NAVIGATION);
        });

        it('shows the debug buttons when told to', function () {
            view.emit('debug-hotkey-pressed');
            expect(view.issue_nav_buttons.show).toHaveBeenCalled();
        });

        it('loads jumps to next set of articles when the debug forward button is clicked', function () {
            settings.highest_article_read = 5;
            view.issue_nav_buttons.forward_button.emit('clicked');
            expect(settings.start_article).toBe(5);
            expect(settings.bookmark_page).toBe(0);
        });

        it('resets content when debug back button is clicked', function () {
            settings.highest_article_read = 5;
            settings.start_article = 3;
            settings.bookmark_page = 4;
            view.issue_nav_buttons.back_button.emit('clicked');
            expect(settings.start_article).toBe(0);
            expect(settings.bookmark_page).toBe(0);
        });

        it('resets start_article counter when all content in magazine is exhausted', function () {
            engine.get_objects_by_query_finish.and.returnValue([[], null]);
            settings.start_article = 4;
            settings.bookmark_page = 4;
            view.issue_nav_buttons.forward_button.emit('clicked');
            expect(settings.start_article).toBe(0);
            expect(settings.bookmark_page).toBe(0);
        });

        it('loads content from the appropriate set of articles', function () {
            engine.get_objects_by_query.calls.reset();
            settings.start_article = 3;
            settings.notify('start-article');
            expect(engine.get_objects_by_query).toHaveBeenCalled();
            expect(engine.get_objects_by_query.calls.argsFor(0)[0]['offset']).toEqual(3);
        });

        it('removes the old pages when loading new pages', function () {
            engine.get_objects_by_query_finish.and.returnValue([[MOCK_RESULTS[0]], null]);
            spyOn(view, 'remove_all_article_pages').and.callThrough();
            settings.start_article = 3;
            settings.notify('start-article');
            expect(view.remove_all_article_pages).toHaveBeenCalled();
        });

        it('updates the content after enough time has passed since the last update', function () {
            let old_date = new Date(Date.now() - UPDATE_INTERVAL_MS - 1000);
            settings.update_timestamp = old_date.toISOString();
            spyOn(controller, '_update_content');
            controller._check_for_content_update();
            expect(controller._update_content).toHaveBeenCalled();
        });

        it('does not update the content if very little time has passed since the last update', function () {
            let old_date = new Date(Date.now() - UPDATE_INTERVAL_MS / 2);
            settings.update_timestamp = old_date.toISOString();
            spyOn(controller, '_update_content');
            controller._check_for_content_update();
            expect(controller._update_content).not.toHaveBeenCalled();
        });

        it('has correct values after content update', function () {
            settings.highest_article_read = 5;
            controller._update_content();
            expect(settings.start_article).toBe(5);
            expect(settings.bookmark_page).toBe(0);
            expect(settings.update_timestamp).toBeGreaterThan(current_time);
        });

        it('goes to overview_page when opening magazine from standalone_page', function () {
            controller._add_history_item_for_page(3);
            controller._open_magazine();
            expect(dispatcher.last_payload_with_type(Actions.SHOW_FRONT_PAGE)).toBeDefined();
        });

        it('dispatches a pair of search-started and search-ready on search', function (done) {
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                query: 'Azucar',
            });
            Mainloop.idle_add(function () {
                expect(engine.get_objects_by_query)
                    .toHaveBeenCalledWith(jasmine.objectContaining({
                        query: 'Azucar',
                    }),
                    jasmine.any(Object),
                    jasmine.any(Function));

                // Expect all the appropriate dispatches to be made
                expect(dispatcher.dispatched_payloads).toContain(jasmine.objectContaining({
                    action_type: Actions.SEARCH_STARTED,
                    query: 'Azucar',
                }));

                expect(dispatcher.dispatched_payloads).toContain(jasmine.objectContaining({
                    action_type: Actions.CLEAR_SEARCH,
                }));

                expect(dispatcher.dispatched_payloads).toContain(jasmine.objectContaining({
                    action_type: Actions.APPEND_SEARCH,
                    models: MOCK_RESULTS,
                    query: 'Azucar',
                }));

                expect(dispatcher.dispatched_payloads).toContain(jasmine.objectContaining({
                    action_type: Actions.SEARCH_READY,
                    query: 'Azucar',
                }));

                expect(dispatcher.last_payload_with_type(Actions.SHOW_SEARCH_PAGE)).toBeDefined();
                expect(controller.history_model.current_item.query).toBe('Azucar');
                done();
                return GLib.SOURCE_REMOVE;
            });
        });

        it('dispatches suggested articles to be dispatched upon request', function (done) {
            dispatcher.dispatch({
                action_type: Actions.NEED_MORE_SUGGESTED_ARTICLES,
                query: 'Nothing here',
            });
            Mainloop.idle_add(function () {
                expect(engine.get_objects_by_query)
                    .toHaveBeenCalledWith(jasmine.objectContaining({
                        sort: QueryObject.QueryObjectSort.ARTICLE_NUMBER,
                        tags: ['EknArticleObject'],
                    }),
                    jasmine.any(Object),
                    jasmine.any(Function));

                // Expect all the appropriate dispatches to be made
                expect(dispatcher.dispatched_payloads).toContain(jasmine.objectContaining({
                    action_type: Actions.APPEND_SUGGESTED_ARTICLES,
                    models: MOCK_RESULTS,
                }));

                done();
                return GLib.SOURCE_REMOVE;
            });
        });

        it('dispatches a pair of search-started and search-failed if the search fails', function () {
            spyOn(window, 'logError');  // silence console output
            engine.get_objects_by_query_finish.and.throwError(new Error('jet fuel can\'t melt dank memes'));
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                query: 'bad query',
            });
            expect(dispatcher.dispatched_payloads).toContain(jasmine.objectContaining({
                action_type: Actions.SEARCH_STARTED,
                query: 'bad query',
            }));
            expect(dispatcher.dispatched_payloads).toContain(jasmine.objectContaining({
                action_type: Actions.SEARCH_FAILED,
                query: 'bad query',
            }));
        });

        it('records a metric when search-entered is dispatched', function (done) {
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
                query: 'Azucar',
            });
            Mainloop.idle_add(function () {
                expect(controller.record_search_metric).toHaveBeenCalled();
                done();
                return GLib.SOURCE_REMOVE;
            });
        });

        it('issues a search query when triggered by desktop search', function (done) {
            controller.search('', 'Azucar');
            Mainloop.idle_add(function () {
                expect(engine.get_objects_by_query)
                    .toHaveBeenCalledWith(jasmine.objectContaining({
                        query: 'Azucar',
                    }),
                    jasmine.any(Object),
                    jasmine.any(Function));
                expect(dispatcher.last_payload_with_type(Actions.SHOW_SEARCH_PAGE)).toBeDefined();
                expect(controller.history_model.current_item.query).toBe('Azucar');
                done();
                return GLib.SOURCE_REMOVE;
            });
        });
    });
});
