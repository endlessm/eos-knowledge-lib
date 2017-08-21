const Eknc = imports.gi.EosKnowledgeContent;

const Actions = imports.app.actions;
const AppUtils = imports.app.utils;
const EntryPoints = imports.app.entryPoints;
const MeshHistoryStore = imports.app.meshHistoryStore;
const MockDispatcher = imports.tests.mockDispatcher;
const MockEngine = imports.tests.mockEngine;
const MockReadingHistoryModel = imports.tests.mockReadingHistoryModel;
const Pages = imports.app.pages;
const Utils = imports.tests.utils;

describe('MeshHistoryStore', function () {
    let store, dispatcher, engine, reading_history;
    let start_content_access_metric_spy;

    beforeEach(function () {
        dispatcher = MockDispatcher.mock_default();
        engine = MockEngine.mock_default();
        reading_history = MockReadingHistoryModel.mock_default();
        store = new MeshHistoryStore.MeshHistoryStore();
        store.set_current_item_from_props({ page_type: Pages.HOME });
        spyOn(AppUtils, 'record_search_metric');
        start_content_access_metric_spy = spyOn(AppUtils, 'start_content_access_metric');
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

    it('shows the article page when item clicked', function () {
        let model = Eknc.ArticleObjectModel.new_from_props({
            ekn_id: 'ekn://foo/bar',
        });
        dispatcher.dispatch({
            action_type: Actions.ITEM_CLICKED,
            model: model,
        });
        expect(store.get_current_item().page_type).toBe(Pages.ARTICLE);
        expect(AppUtils.start_content_access_metric)
            .toHaveBeenCalledWith(store.get_current_item().model,
                EntryPoints.LINK_CLICKED);
    });

    it('goes back to the home page via the sidebar from search page', function () {
        store.set_current_item_from_props({
            page_type: Pages.SEARCH,
        });
        dispatcher.dispatch({
            action_type: Actions.NAV_BACK_CLICKED,
        });
        expect(store.get_current_item().page_type).toBe(Pages.HOME);
    });

    it('goes back to the home page via the sidebar from set page', function () {
        store.set_current_item_from_props({
            page_type: Pages.SET,
        });
        dispatcher.dispatch({
            action_type: Actions.NAV_BACK_CLICKED,
        });
        expect(store.get_current_item().page_type).toBe(Pages.HOME);
    });

    it('goes back to the home page via the sidebar from article page after having gone directly there', function () {
        store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
        });
        dispatcher.dispatch({
            action_type: Actions.NAV_BACK_CLICKED,
        });
        expect(store.get_current_item().page_type).toBe(Pages.HOME);
    });

    it('goes back to the search page via the sidebar from article page', function () {
        store.set_current_item_from_props({
            page_type: Pages.SEARCH,
        });
        store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
        });
        dispatcher.dispatch({
            action_type: Actions.NAV_BACK_CLICKED,
        });
        expect(store.get_current_item().page_type).toBe(Pages.SEARCH);
    });

    it('goes back to the set page via the sidebar from article page', function () {
        store.set_current_item_from_props({
            page_type: Pages.SET,
        });
        store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
        });
        dispatcher.dispatch({
            action_type: Actions.NAV_BACK_CLICKED,
        });
        expect(store.get_current_item().page_type).toBe(Pages.SET);
    });

    it('sets the appropriate state when item clicked with a query (e.g. autocomplete)', function () {
        let model = Eknc.ArticleObjectModel.new_from_props({
            ekn_id: 'ekn://foo/bar',
        });
        dispatcher.dispatch({
            action_type: Actions.ITEM_CLICKED,
            model: model,
            query: 'foo',
        });
        let item = store.get_current_item();
        expect(item.page_type).toBe(Pages.ARTICLE);
        expect(item.model.ekn_id).toBe(model.ekn_id);
        expect(item.query).toBe('foo');
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
        beforeEach(function() {
            let model = Eknc.ArticleObjectModel.new_from_props({
                ekn_id: 'ekn://foo/bar',
            });
            engine.get_object_promise.and.returnValue(Promise.resolve(model));
            dispatcher.dispatch({
                action_type: Actions.ARTICLE_LINK_CLICKED,
                ekn_id: 'ekn://foo/bar',
            });
            Utils.update_gui();
        });

        it('goes to article page', function () {
            expect(store.get_current_item().page_type).toBe(Pages.ARTICLE);
        });

        it('records a metric', function () {
            recent_start_call = start_content_access_metric_spy.calls.mostRecent();
            expect(recent_start_call.args[0].ekn_id).toEqual('ekn://foo/bar');
            expect(recent_start_call.args[1]).toEqual(EntryPoints.ARTICLE_LINK_CLICKED);
        });
    });

    describe('when a media link in article clicked', function () {
        it('shows lightbox', function () {
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

    describe('when desktop search result opened', function () {
        let model;

        it('loads an item', function () {
            model = Eknc.ArticleObjectModel.new_from_props({
                ekn_id: 'ekn:///foo',
            });
            engine.get_object_promise.and.returnValue(Promise.resolve(model));
            dispatcher.dispatch({
                action_type: Actions.DBUS_LOAD_ITEM_CALLED,
                query: 'foo',
                ekn_id: 'ekn:///foo',
            });

            expect(engine.get_object_promise).toHaveBeenCalled();
            expect(engine.get_object_promise.calls.mostRecent().args[0])
                .toBe('ekn:///foo');
        });

        it('goes to the article page if an article was opened', function () {
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

            expect(store.get_current_item().page_type).toBe(Pages.ARTICLE);
        });

        it('records a metric if an article was opened', function () {
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

            recent_start_call = start_content_access_metric_spy.calls.mostRecent();
            expect(recent_start_call.args[0].ekn_id).toEqual('ekn:///foo');
            expect(recent_start_call.args[1]).toEqual(EntryPoints.DBUS_CALL);
        });

        it('goes to the set page if an article was opened', function () {
            model = Eknc.SetObjectModel.new_from_props({
                ekn_id: 'ekn:///foo',
            });
            engine.get_object_promise.and.returnValue(Promise.resolve(model));
            dispatcher.dispatch({
                action_type: Actions.DBUS_LOAD_ITEM_CALLED,
                query: 'foo',
                ekn_id: 'ekn:///foo',
            });
            Utils.update_gui();

            expect(store.get_current_item().page_type).toBe(Pages.SET);
        });
    });
});
