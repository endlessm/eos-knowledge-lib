// Copyright 2015 Endless Mobile, Inc.

/* exported Buffet */

const GObject = imports.gi.GObject;

const Actions = imports.app.actions;
const BuffetHistoryStore = imports.app.buffetHistoryStore;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const Controller = imports.app.interfaces.controller;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const Pages = imports.app.pages;
const ReadingHistoryModel = imports.app.readingHistoryModel;
const SetMap = imports.app.setMap;
const QueryObject = imports.search.queryObject;

const RESULTS_SIZE = 15;

/**
 * Class: Buffet
 * Controller that presents all the content and lets the user choose
 *
 * For the Travel app, we serve up all the content at once.
 * The various presentation modules (e.g. <Highlights>) sort it, and the
 * arrangements (e.g. <WindshieldArrangement>) present it in attractive ways.
 * The user can pass along the buffet table, choosing what looks nice.
 *
 * Implements:
 *    <Module>, <Controller>
 */
const Buffet = new Module.Class({
    Name: 'Controller.Buffet',
    Extends: GObject.Object,
    Implements: [Controller.Controller],

    _init: function (props={}) {
        this.parent(props);

        let history = new BuffetHistoryStore.BuffetHistoryStore();
        HistoryStore.set_default(history);

        this._window = this.create_submodule('window', {
            application: this.application,
            visible: false,
        });

        this.load_theme();

        history.connect('changed', this._on_history_change.bind(this));
    },

    make_ready: function (cb=function () {}) {
        // Load all sets, with which to populate the highlights and thematic
        // pages
        Engine.get_default().get_objects_by_query(new QueryObject.QueryObject({
            limit: -1,
            tags_match_any: ['EknSetObject'],
        }), null, (engine, res) => {
            let models;
            try {
                [models] = engine.get_objects_by_query_finish(res);
            } catch (e) {
                logError(e, 'Failed to load sets from database');
                return;
            }

            SetMap.init_map_with_models(models);

            this._window.make_ready(cb);
        });
    },

    _do_search: function (history_item) {
        let dispatcher = Dispatcher.get_default();
        let query_obj = new QueryObject.QueryObject({
            query: history_item.query,
            limit: RESULTS_SIZE,
            tags_match_any: ['EknArticleObject'],
        });
        Engine.get_default().get_objects_by_query(query_obj, null, (engine, task) => {
            let results, info;
            try {
                [results, info] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                logError(error);
                let dispatcher = Dispatcher.get_default();
                dispatcher.dispatch({
                    action_type: Actions.SEARCH_FAILED,
                    query: history_item.query,
                    error: error,
                });
                return;
            }
            this._get_more_results_query = info.more_results;

            if (results.length > 0) {
                dispatcher.dispatch({
                    action_type: Actions.FEATURE_ITEM,
                    model: results[0],
                });
            }
        });
    },

    _on_history_change: function () {
        let item = HistoryStore.get_default().get_current_item();
        let dispatcher = Dispatcher.get_default();

        switch (item.page_type) {
            case Pages.SEARCH:
                this._do_search(item);
                break;
            case Pages.ARTICLE:
                dispatcher.dispatch({
                    action_type: Actions.FEATURE_ITEM,
                    model: item.model,
                });

                ReadingHistoryModel.get_default().mark_article_read(item.model.ekn_id);
                break;
        }
    },
});
