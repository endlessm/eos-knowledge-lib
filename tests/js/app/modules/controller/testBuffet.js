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
        store = HistoryStore.get_default();
        spyOn(AppUtils, 'record_search_metric');
    });

    it('records reading history on state change to article page', function() {
        let prev_model = new ArticleObjectModel.ArticleObjectModel({
            ekn_id: 'ekn://test/prev',
        });
        let next_model = new ArticleObjectModel.ArticleObjectModel({
            ekn_id: 'ekn://test/next',
        });
        engine.get_object_by_id_finish.and.returnValue(article_model);
        store.set_current_item_from_props({
            page_type: Pages.ARTICLE,
            model: article_model,
            context: [prev_model, article_model, next_model],
            context_label: 'Some Context',
        });

        expect(reading_history.mark_article_read).toHaveBeenCalledWith(article_model.ekn_id);
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
            expect(dispatcher.last_payload_with_type(Actions.SEARCH_READY).query)
                .toEqual('user query');
        });
    });
});
