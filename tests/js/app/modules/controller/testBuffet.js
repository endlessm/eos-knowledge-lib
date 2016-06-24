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
const MediaObjectModel = imports.search.mediaObjectModel;
const Module = imports.app.interfaces.module;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockFactory = imports.tests.mockFactory;
const MockReadingHistoryModel = imports.tests.mockReadingHistoryModel;
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
    let buffet, dispatcher, engine, factory, set_models, article_model, media_model, reading_history;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        reading_history = MockReadingHistoryModel.mock_default();

        set_models = [0, 1, 2].map(() => new SetObjectModel.SetObjectModel());
        article_model = new ArticleObjectModel.ArticleObjectModel({
            ekn_id: 'ekn://test/article',
        });
        media_model = new MediaObjectModel.MediaObjectModel();

        engine = MockEngine.mock_default();
        engine.get_objects_by_query_finish.and.returnValue([set_models, null]);

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
        spyOn(AppUtils, 'record_search_metric');
    });

    it('dispatches present window on launch from desktop', function () {
        buffet.desktop_launch(0);
        expect(dispatcher.last_payload_with_type(Actions.PRESENT_WINDOW)).toBeDefined();
    });

    it('dispatches present window on launch from search', function () {
        buffet.search(0, 'query');
        expect(dispatcher.last_payload_with_type(Actions.PRESENT_WINDOW)).toBeDefined();
    });

    it('dispatches present window on launch from search result', function () {
        engine.get_object_by_id_finish.and.returnValue(new ContentObjectModel.ContentObjectModel());
        buffet.activate_search_result(0, 'ekn://foo/bar', 'query');
        expect(dispatcher.last_payload_with_type(Actions.PRESENT_WINDOW)).toBeDefined();
    });

    it('shows the brand page until timeout has expired and content is ready', function () {
        buffet.BRAND_PAGE_TIME_MS = 0;
        buffet.desktop_launch(0);
        Utils.update_gui();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_BRAND_PAGE)).toBeDefined();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).not.toBeDefined();
        buffet.make_ready();
        Utils.update_gui();
        expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).toBeDefined();
    });

    it('shows the brand page only once', function () {
        buffet.BRAND_PAGE_TIME_MS = 0;
        buffet.desktop_launch(0);
        dispatcher.dispatch({
            action_type: Actions.MODULE_READY,
        });
        buffet.desktop_launch(0);
        Utils.update_gui();
        let payloads = dispatcher.payloads_with_type(Actions.SHOW_BRAND_PAGE);
        expect(payloads.length).toBe(1);
    });

    it('does not show the brand page on other launch methods', function () {
        buffet.BRAND_PAGE_TIME_MS = 0;
        engine.get_object_by_id_finish.and.returnValue(new ContentObjectModel.ContentObjectModel());
        buffet.search(0, 'query');
        buffet.activate_search_result(0, 'ekn://foo/bar', 'query');
        Utils.update_gui();
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

    describe('when a set is clicked', function () {
        beforeEach(function () {
            buffet.BRAND_PAGE_TIME_MS = 0;
            buffet.desktop_launch(0);
            buffet.make_ready();
            Utils.update_gui();
            dispatcher.dispatch({
                action_type: Actions.SET_CLICKED,
                model: set_models[0],
            });
        });

        it('changes to the set page', function () {
            expect(dispatcher.last_payload_with_type(Actions.SHOW_SECTION_PAGE))
                .toBeDefined();
        });

        it('signals that a set should be loaded', function () {
            expect(dispatcher.last_payload_with_type(Actions.SHOW_SET).model)
                .toBe(set_models[0]);
        });

        it('goes back to the home page in the history', function () {
            dispatcher.reset();
            dispatcher.dispatch({
                action_type: Actions.HISTORY_BACK_CLICKED,
            });
            expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE))
                .toBeDefined();
        });

        it('goes forward to the set page in the history again', function () {
            dispatcher.dispatch({
                action_type: Actions.HISTORY_BACK_CLICKED,
            });
            dispatcher.reset();
            dispatcher.dispatch({
                action_type: Actions.HISTORY_FORWARD_CLICKED,
            });
            expect(dispatcher.last_payload_with_type(Actions.SHOW_SECTION_PAGE))
                .toBeDefined();
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

        it('goes back to the home page when the home button is clicked', function () {
            dispatcher.dispatch({
                action_type: Actions.HOME_CLICKED,
            });
            expect(dispatcher.last_payload_with_type(Actions.SHOW_HOME_PAGE)).toBeDefined();
        });
    });

    let test_article_click_action = (action, descriptor) => {
        describe('when a ' + descriptor + ' is clicked', function () {
            let prev_model, next_model;
            beforeEach(function () {
                prev_model = new ArticleObjectModel.ArticleObjectModel({
                    ekn_id: 'ekn://test/prev',
                });
                next_model = new ArticleObjectModel.ArticleObjectModel({
                    ekn_id: 'ekn://test/next',
                });

                dispatcher.dispatch({
                    action_type: action,
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

            it('handles previous card click', function () {
                dispatcher.dispatch({
                    action_type: Actions.PREVIOUS_DOCUMENT_CLICKED,
                    model: prev_model,
                });
                let payload = dispatcher.last_payload_with_type(Actions.SHOW_ARTICLE);
                expect(payload.model).toBe(prev_model);
            });

            it('handles previous card click', function () {
                dispatcher.dispatch({
                    action_type: Actions.NEXT_DOCUMENT_CLICKED,
                    model: next_model,
                });
                let payload = dispatcher.last_payload_with_type(Actions.SHOW_ARTICLE);
                expect(payload.model).toBe(next_model);
            });
        });
    };
    test_article_click_action(Actions.ITEM_CLICKED, 'item');
    test_article_click_action(Actions.SEARCH_CLICKED, 'search item');
    test_article_click_action(Actions.AUTOCOMPLETE_CLICKED, 'autocomplete entry');

    describe('when an article is clicked', function () {
        it('dispatches unread articles from both within and outside current category', function () {
            engine.get_object_by_id_finish.and.returnValue(article_model);
            dispatcher.dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: article_model,
            });
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

    describe('when a set link is clicked', function () {
        it('changes to the set page if link is a set', function () {
            let set_model = new SetObjectModel.SetObjectModel({
                ekn_id: 'ekn://test/set',
            });

            engine.get_object_by_id_finish.and.returnValue(set_model);
            dispatcher.dispatch({
                action_type: Actions.SEARCH_CLICKED,
                model: set_model,
            });
            let payload = dispatcher.last_payload_with_type(Actions.SHOW_SET);
            expect(payload.model).toBe(set_model);
        });
    });

    describe('when a link is clicked', function () {
        it('changes to the article page if link is an article', function () {
            engine.get_object_by_id_finish.and.returnValue(article_model);
            dispatcher.dispatch({
                action_type: Actions.ARTICLE_LINK_CLICKED,
                ekn_id: 'ekn://foo/bar',
            });
            let payload = dispatcher.last_payload_with_type(Actions.SHOW_ARTICLE);
            expect(payload.model).toBe(article_model);
        });

        it('changes to the set page if link is a set', function () {
            engine.get_object_by_id_finish.and.returnValue(set_models[0]);
            dispatcher.dispatch({
                action_type: Actions.ARTICLE_LINK_CLICKED,
                ekn_id: 'ekn://foo/bar',
            });
            let payload = dispatcher.last_payload_with_type(Actions.SHOW_SET);
            expect(payload.model).toBe(set_models[0]);
        });

        it('shows media if the link is a media object', function () {
            engine.get_object_by_id_finish.and.returnValue(media_model);
            dispatcher.dispatch({
                action_type: Actions.ARTICLE_LINK_CLICKED,
                ekn_id: 'ekn://foo/bar',
            });
            let payload = dispatcher.last_payload_with_type(Actions.SHOW_MEDIA);
            expect(payload.model).toBe(media_model);
        });
    });

    describe('when browse categories title is clicked', function () {
        it('changes to the all categories page', function () {
            dispatcher.dispatch({
                action_type: Actions.ALL_SETS_CLICKED,
            });
            expect(dispatcher.last_payload_with_type(Actions.SHOW_ALL_SETS_PAGE)).toBeDefined();
        });
    });

    describe('when a search query is entered', function () {
        beforeEach(function () {
            // Simulate batches of results
            engine.get_objects_by_query.calls.reset();
            engine.get_objects_by_query_finish.and.callFake(() => {
                let calls = engine.get_objects_by_query.calls.count();
                if (calls == 1)
                    return [[0, 1, 2, 3, 4].map(() =>
                        new ContentObjectModel.ContentObjectModel()), 1];
                if (calls == 2)
                    return [[0, 1].map(() =>
                        new ContentObjectModel.ContentObjectModel()), null];
                return [[], null];
            });
            dispatcher.dispatch({
                action_type: Actions.SEARCH_TEXT_ENTERED,
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

        it('records a search metric', function () {
            expect(AppUtils.record_search_metric).toHaveBeenCalledWith('user query');
        });
    });
});
