// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

Gtk.init(null);

const Utils = imports.tests.utils;
Utils.register_gresource();

const Actions = imports.app.actions;
const AppUtils = imports.app.utils;
const ArticleObjectModel = imports.search.articleObjectModel;
const Buffet = imports.app.modules.controller.buffet;
const ContentObjectModel = imports.search.contentObjectModel;
const HistoryStore = imports.app.historyStore;
const MediaObjectModel = imports.search.mediaObjectModel;
const Module = imports.app.interfaces.module;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const MockReadingHistoryModel = imports.tests.mockReadingHistoryModel;
const Pages = imports.app.pages;
const SetObjectModel = imports.search.setObjectModel;

const MockView = new Module.Class({
    Name: 'testBuffetController_MockView',
    Extends: Gtk.Window,
    Implements: [ Module.Module ],

    Properties: {
        'template-type': GObject.ParamSpec.string('template-type', '', '',
            GObject.ParamFlags.READWRITE, ''),
    },
});

describe('Controller.Buffet', function () {
    let buffet, dispatcher, engine, factory, set_models, article_model, store;
    let media_model, reading_history;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        reading_history = MockReadingHistoryModel.mock_default();

        set_models = [0, 1, 2].map(() => new SetObjectModel.SetObjectModel());
        article_model = new ArticleObjectModel.ArticleObjectModel({
            ekn_id: 'ekn://test/article',
        });
        media_model = new MediaObjectModel.MediaObjectModel();

        engine = MockEngine.mock_default();
        engine.get_objects_by_query_finish.and.returnValue([set_models, {
            more_results: null,
        }]);

        spyOn(reading_history, 'mark_article_read');

        [buffet, factory] = MockFactory.setup_tree({
            type: Buffet.Buffet,
            properties: {
                'theme': '',
            },
            slots: {
                'window': { type: MockView },
            },
        });
        buffet.BRAND_PAGE_TIME_MS = 0;
        store = HistoryStore.get_default();
        spyOn(AppUtils, 'record_search_metric');
    });

    it('shows the brand page until timeout has expired and content is ready', function () {
        store.set_current_item_from_props({
            page_type: Pages.HOME,
        });
        expect(dispatcher.last_payload_with_type(Actions.SHOW_BRAND_PAGE)).toBeDefined();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).not.toBeDefined();
        buffet.make_ready();
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

    it('does not show the brand page when launching into other pages', function () {
        store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
            model: new ArticleObjectModel.ArticleObjectModel(),
        });
        expect(dispatcher.last_payload_with_type(Actions.SHOW_BRAND_PAGE)).not.toBeDefined();
    });

    it('dispatches set models to populate the app with', function () {
        buffet.make_ready();
        let payloads = dispatcher.payloads_with_type(Actions.APPEND_SETS);
        expect(payloads.length).toBe(1);
        expect(set_models).toEqual(payloads[0].models);
        expect(engine.get_objects_by_query)
            .toHaveBeenCalledWith(jasmine.objectContaining({ tags_match_any: ['EknSetObject'] }),
                jasmine.any(Object), jasmine.any(Function));
    });

    describe('on state change to set page', function () {
        beforeEach(function () {
            dispatcher.dispatch({
                action_type: Actions.LAUNCHED_FROM_DESKTOP,
            });
            buffet.make_ready();
            store.set_current_item_from_props({
                page_type: Pages.SET,
                model: set_models[0],
            });
        });

        it('changes to the set page', function () {
            expect(dispatcher.last_payload_with_type(Actions.SHOW_SET_PAGE))
                .toBeDefined();
        });

        it('signals that a set should be loaded', function () {
            expect(dispatcher.last_payload_with_type(Actions.SHOW_SET).model)
                .toBe(set_models[0]);
        });

        it('dispatch a set of unread articles', function () {
            let payload = dispatcher.last_payload_with_type(Actions.APPEND_SUPPLEMENTARY_ARTICLES);
            expect(payload).toBeDefined();
            expect(payload.same_set).toBeFalsy();
            expect(engine.get_objects_by_query.calls.mostRecent().args[0])
                .toEqual(jasmine.objectContaining({
                    tags_match_all: jasmine.arrayContaining(['EknArticleObject']),
                }));
        });
    });

    it('goes back to the home page when state changes to home page', function () {
        buffet.make_ready();
        store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
            model: article_model,
        });
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).not.toBeDefined();
        store.set_current_item_from_props({
            page_type: Pages.HOME,
        });
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).toBeDefined();
    });

    describe('on state change to article page', function () {
        let prev_model, next_model;

        beforeEach(function () {
            prev_model = new ArticleObjectModel.ArticleObjectModel({
                ekn_id: 'ekn://test/prev',
            });
            next_model = new ArticleObjectModel.ArticleObjectModel({
                ekn_id: 'ekn://test/next',
            });
            engine.get_object_by_id_finish.and.returnValue(article_model);
            store.set_current_item_from_props({
                page_type: Pages.ARTICLE,
                model: article_model,
                context: [prev_model, article_model, next_model],
                context_label: 'Some Context',
            });
        });

        it('records reading history', function() {
            expect(reading_history.mark_article_read).toHaveBeenCalledWith(article_model.ekn_id);
        });

        it('changes to the article page', function () {
            let payload = dispatcher.last_payload_with_type(Actions.SHOW_ARTICLE_PAGE);
            expect(payload).toBeDefined();
        });

        it('dispatches show article with the article model', function () {
            let payload = dispatcher.last_payload_with_type(Actions.SHOW_ARTICLE);
            expect(payload.model).toBe(article_model);
        });

        it('dispatches show article with previous and next models', function () {
            let payload = dispatcher.last_payload_with_type(Actions.SHOW_ARTICLE);
            expect(payload.previous_model).toBe(prev_model);
            expect(payload.next_model).toBe(next_model);
        });

        it('dispatches show article with a context label', function () {
            let payload = dispatcher.last_payload_with_type(Actions.SHOW_ARTICLE_PAGE);
            expect(payload.context_label).toBe('Some Context');
        });

        it('dispatches unread articles from both within and outside current category', function () {
            let payloads = dispatcher.payloads_with_type(Actions.APPEND_SUPPLEMENTARY_ARTICLES);
            expect(payloads.length).toBe(2);

            expect(payloads[0].need_unread).toBeTruthy();
            expect(payloads[1].need_unread).toBeTruthy();
            // One of the dispatches should ask for articles from the same set
            // and the other should ask for articles from different sets. Ensure
            // that we are getting both types.
            if (payloads[0].same_set === true) {
                expect(payloads[1].same_set).toBeFalsy();
            } else {
                expect(payloads[1].same_set).toBeTruthy();
            }
        });
    });

    it('changes to the all sets page on state change', function () {
        store.set_current_item_from_props({
            page_type: Pages.ALL_SETS,
        });
        expect(dispatcher.last_payload_with_type(Actions.SHOW_ALL_SETS_PAGE)).toBeDefined();
    });

    describe('on state change to search page', function () {
        beforeEach(function () {
            // Simulate batches of results
            engine.get_objects_by_query.calls.reset();
            engine.get_objects_by_query_finish.and.callFake(() => {
                let calls = engine.get_objects_by_query.calls.count();
                if (calls == 1)
                    return [
                        [0, 1, 2, 3, 4].map(() =>
                            new ContentObjectModel.ContentObjectModel()),
                        { more_results: 1 },
                    ];
                if (calls == 2)
                    return [
                        [0, 1].map(() =>
                            new ContentObjectModel.ContentObjectModel()),
                        { more_results: null },
                    ];
                return [[], { more_results: null }];
            });
            store.set_current_item_from_props({
                page_type: Pages.SEARCH,
                query: 'user query',
            });
        });

        it('launches a search', function () {
            expect(dispatcher.last_payload_with_type(Actions.SEARCH_STARTED).query)
                .toEqual('user query');
            expect(dispatcher.last_payload_with_type(Actions.SHOW_SEARCH_PAGE))
                .toBeDefined();
            expect(dispatcher.last_payload_with_type(Actions.SEARCH_READY).query)
                .toEqual('user query');
        });

        it('batches the results', function () {
            expect(dispatcher.last_payload_with_type(Actions.CLEAR_SEARCH))
                .toBeDefined();
            let append_payloads = dispatcher.payloads_with_type(Actions.APPEND_SEARCH);
            expect(append_payloads.length).toBe(1);
            expect(append_payloads[0].models.length).toBe(5);

            dispatcher.dispatch({
                action_type: Actions.NEED_MORE_SEARCH,
            });
            Utils.update_gui();
            append_payloads = dispatcher.payloads_with_type(Actions.APPEND_SEARCH);
            expect(append_payloads.length).toBe(2);
            expect(append_payloads[1].models.length).toBe(2);
        });
    });
});
