const Eknc = imports.gi.EosKnowledgeContent;

const Actions = imports.app.actions;
const AppUtils = imports.app.utils;
const BuffetHistoryStore = imports.app.buffetHistoryStore;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockReadingHistoryModel = imports.tests.mockReadingHistoryModel;
const Pages = imports.app.pages;
const Utils = imports.tests.utils;

describe('BuffetHistoryStore', function () {
    let store, dispatcher, engine, reading_history;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        reading_history = MockReadingHistoryModel.mock_default();
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

    it('shows the set page when a set model is clicked', function () {
        let model = Eknc.SetObjectModel.new_from_props({
            ekn_id: 'ekn://foo/set',
        });
        dispatcher.dispatch({
            action_type: Actions.ITEM_CLICKED,
            model: model,
        });
        expect(store.get_current_item().page_type).toBe(Pages.SET);
    });

    function test_close_lightbox (action, descriptor) {
        it('closes the lightbox when ' + descriptor, function () {
            let model = Eknc.ArticleObjectModel.new_from_props({
                ekn_id: 'ekn://foo/bar',
            });
            let media_model = Eknc.MediaObjectModel.new_from_props({
                ekn_id: 'ekn://foo/pix',
            });
            store.set_current_item_from_props({
                page_type: Pages.ARTICLE,
                model: model,
                media_model: media_model,
            });
            dispatcher.dispatch({
                action_type: action,
            });
            expect(store.get_current_item().media_model).toBeNull();
        });
    }
    test_close_lightbox(Actions.LIGHTBOX_CLOSED, 'lightbox close clicked');
    test_close_lightbox(Actions.SEARCH_BOX_FOCUSED, 'search box focused');

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
            let model = Eknc.ArticleObjectModel.new_from_props({
                ekn_id: 'ekn://foo/bar',
            });
            engine.get_object_promise.and.returnValue(Promise.resolve(model));
            dispatcher.dispatch({
                action_type: Actions.ARTICLE_LINK_CLICKED,
                ekn_id: 'ekn://foo/bar',
            });
            Utils.update_gui();
            expect(store.get_current_item().page_type).toBe(Pages.ARTICLE);
        });

        it('shows lightbox if link was media', function () {
            let model = Eknc.MediaObjectModel.new_from_props({
                ekn_id: 'ekn://foo/pix',
            });
            engine.get_object_promise.and.returnValue(Promise.resolve(model));
            dispatcher.dispatch({
                action_type: Actions.ARTICLE_LINK_CLICKED,
                ekn_id: 'ekn://foo/pix',
            });
            Utils.update_gui();
            expect(store.get_current_item().media_model).toBe(model);
        });
    });

    describe('when an article card is clicked', function () {
        beforeEach(function () {
            let model = Eknc.ArticleObjectModel.new_from_props({
                ekn_id: 'ekn://test/article',
            });

            dispatcher.dispatch({
                action_type: Actions.ITEM_CLICKED,
                model: model,
                context: [model],
                context_label: 'Some Context',
            });
        });

        it('goes to article page', function () {
            let item = store.get_current_item();
            expect(item.page_type).toBe(Pages.ARTICLE);
        });
    });

    describe('when desktop search result opened', function () {
        let model;

        beforeEach(function () {
            model = Eknc.ArticleObjectModel.new_from_props({
                ekn_id: 'ekn:///foo',
            });
            engine.get_object_promise.and.returnValue(Promise.resolve(model));
            dispatcher.dispatch({
                action_type: Actions.DBUS_LOAD_ITEM_CALLED,
                query: 'foo',
                ekn_id: 'ekn:///foo',
            });
            Utils.update_gui();
        });

        it('loads an item', function () {
            expect(engine.get_object_promise).toHaveBeenCalled();
            expect(engine.get_object_promise.calls.mostRecent().args[0])
                .toBe('ekn:///foo');
        });

        it('goes to the article page', function () {
            expect(store.get_current_item().page_type).toBe(Pages.ARTICLE);
        });
    });
});
