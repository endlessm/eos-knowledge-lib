const Actions = imports.app.actions;
const AppUtils = imports.app.utils;
const ArticleObjectModel = imports.search.articleObjectModel;
const BuffetHistoryStore = imports.app.buffetHistoryStore;
const MediaObjectModel = imports.search.mediaObjectModel;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const Pages = imports.app.pages;
const SetObjectModel = imports.search.setObjectModel;

describe('BuffetHistoryStore', function () {
    let store, dispatcher, engine;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        engine = MockEngine.mock_default();
        store = new BuffetHistoryStore.BuffetHistoryStore();
        store.set_current_item_from_props({ page_type: Pages.HOME });
        spyOn(AppUtils, 'record_search_metric');
    });

    it('goes back to the home page when home button is clicked', function () {
        dispatcher.dispatch({
            action_type: Actions.HOME_CLICKED,
        });
        expect(store.get_current_item().page_type).toBe(Pages.HOME);
    });

    it('goes to the home page when launched from desktop', function () {
        dispatcher.dispatch({
            action_type: Actions.LAUNCHED_FROM_DESKTOP,
        });
        expect(store.get_current_item().page_type).toBe(Pages.HOME);
    });

    it('shows the all-sets page when all-sets clicked', function () {
        dispatcher.dispatch({
            action_type: Actions.ALL_SETS_CLICKED,
        });
        expect(store.get_current_item().page_type).toBe(Pages.ALL_SETS);
    });

    it('shows the set page when set clicked', function () {
        let model = new SetObjectModel.SetObjectModel({
            ekn_id: 'ekn://foo/set',
        });
        dispatcher.dispatch({
            action_type: Actions.SET_CLICKED,
            model: model,
        });
        expect(store.get_current_item().page_type).toBe(Pages.SET);
    });

    describe('when set clicked', function () {
        let model;

        beforeEach(function () {
            model = new SetObjectModel.SetObjectModel({
                ekn_id: 'ekn://foo/bar',
            });
        });

        it('in search results, shows the set page', function () {
            dispatcher.dispatch({
                action_type: Actions.SEARCH_CLICKED,
                model: model,
            });
            expect(store.get_current_item().page_type).toBe(Pages.SET);
        });

        it('in autocomplete, shows the set page', function () {
            dispatcher.dispatch({
                action_type: Actions.AUTOCOMPLETE_CLICKED,
                model: model,
            });
            expect(store.get_current_item().page_type).toBe(Pages.SET);
        });
    });

    describe('when article clicked', function () {
        let model;

        beforeEach(function () {
            model = new ArticleObjectModel.ArticleObjectModel({
                ekn_id: 'ekn://foo/bar',
            });
        });

        it('in item listing, shows the article page', function () {
            dispatcher.dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
            });
            expect(store.get_current_item().page_type).toBe(Pages.ARTICLE);
        });

        it('in search results, shows the article page', function () {
            dispatcher.dispatch({
                action_type: Actions.SEARCH_CLICKED,
                model: model,
            });
            expect(store.get_current_item().page_type).toBe(Pages.ARTICLE);
        });

        it('in autocomplete, shows the article page', function () {
            dispatcher.dispatch({
                action_type: Actions.AUTOCOMPLETE_CLICKED,
                model: model,
            });
            expect(store.get_current_item().page_type).toBe(Pages.ARTICLE);
        });
    });

    function test_search_action (action, descriptor) {
        describe('when ' + descriptor, function () {
            beforeEach(function () {
                dispatcher.dispatch({
                    action_type: action,
                    query: 'foo',
                });
            });

            it('goes to the search page', function () {
                expect(store.get_current_item().page_type).toBe(Pages.SEARCH);
            });

            it('records a metric', function () {
                expect(AppUtils.record_search_metric).toHaveBeenCalled();
            });
        });
    }
    test_search_action(Actions.SEARCH_TEXT_ENTERED, 'search text entered');
    test_search_action(Actions.DBUS_LOAD_QUERY_CALLED, 'desktop search opened');

    describe('when link in article clicked', function () {
        it('goes to article page', function () {
            let model = new ArticleObjectModel.ArticleObjectModel({
                ekn_id: 'ekn://foo/bar',
            });
            engine.get_object_by_id_finish.and.returnValue(model);
            dispatcher.dispatch({
                action_type: Actions.ARTICLE_LINK_CLICKED,
                model: model,
            });
            expect(store.get_current_item().page_type).toBe(Pages.ARTICLE);
        });

        it('shows lightbox if link was media', function () {
            let model = new MediaObjectModel.MediaObjectModel({
                ekn_id: 'ekn://foo/pix',
            });
            engine.get_object_by_id_finish.and.returnValue(model);
            dispatcher.dispatch({
                action_type: Actions.ARTICLE_LINK_CLICKED,
                model: model,
            });
            expect(dispatcher.last_payload_with_type(Actions.SHOW_MEDIA))
                .toBeDefined();
        });
    });

    function test_article_click_action (action, descriptor) {
        describe('when a ' + descriptor + ' is clicked', function () {
            let prev_model, next_model;
            beforeEach(function () {
                let model = new ArticleObjectModel.ArticleObjectModel({
                    ekn_id: 'ekn://test/article',
                });
                prev_model = new ArticleObjectModel.ArticleObjectModel({
                    ekn_id: 'ekn://test/prev',
                });
                next_model = new ArticleObjectModel.ArticleObjectModel({
                    ekn_id: 'ekn://test/next',
                });

                dispatcher.dispatch({
                    action_type: action,
                    model: model,
                    context: [prev_model, model, next_model],
                    context_label: 'Some Context',
                });
            });

            it('goes to article page', function () {
                let item = store.get_current_item();
                expect(item.page_type).toBe(Pages.ARTICLE);
            });

            it('goes to set page if the model was a set', function () {
                let model = new SetObjectModel.SetObjectModel({
                    ekn_id: 'ekn://test/set',
                });
                dispatcher.dispatch({
                    action_type: action,
                    model: model,
                    context: [model],
                    context_label: 'Some context',
                });
                expect(store.get_current_item().page_type).toBe(Pages.SET);
            });

            it('handles previous card click', function () {
                dispatcher.dispatch({
                    action_type: Actions.PREVIOUS_DOCUMENT_CLICKED,
                    model: prev_model,
                });
                let item = store.get_current_item();
                expect(item.page_type).toBe(Pages.ARTICLE);
                expect(item.model).toBe(prev_model);
            });

            it('handles next card click', function () {
                dispatcher.dispatch({
                    action_type: Actions.NEXT_DOCUMENT_CLICKED,
                    model: next_model,
                });
                let item = store.get_current_item();
                expect(item.page_type).toBe(Pages.ARTICLE);
                expect(item.model).toBe(next_model);
            });
        });
    }
    test_article_click_action(Actions.ITEM_CLICKED, 'item');
    test_article_click_action(Actions.SEARCH_CLICKED, 'search item');
    test_article_click_action(Actions.AUTOCOMPLETE_CLICKED, 'autocomplete entry');

    describe('when desktop search result opened', function () {
        let model;

        beforeEach(function () {
            model = new ArticleObjectModel.ArticleObjectModel({
                ekn_id: 'ekn:///foo',
            });
            engine.get_object_by_id_finish.and.returnValue(model);
            dispatcher.dispatch({
                action_type: Actions.DBUS_LOAD_ITEM_CALLED,
                query: 'foo',
                ekn_id: 'ekn:///foo',
            });
        });

        it('loads an item', function () {
            expect(engine.get_object_by_id).toHaveBeenCalled();
            expect(engine.get_object_by_id.calls.mostRecent().args[0])
                .toBe('ekn:///foo');
        });

        it('goes to the article page', function () {
            expect(store.get_current_item().page_type).toBe(Pages.ARTICLE);
        });
    });
});
