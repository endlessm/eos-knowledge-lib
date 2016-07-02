// Copyright 2015 Endless Mobile, Inc.

/* exported Buffet */

const GLib = imports.gi.GLib;
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

    BRAND_PAGE_TIME_MS: 1500,

    _init: function (props={}) {
        this._launched_once = this._timer_ready = this._content_ready = false;

        this.parent(props);

        let history = new BuffetHistoryStore.BuffetHistoryStore();
        HistoryStore.set_default(history);

        this._window = this.create_submodule('window', {
            application: this.application,
            visible: false,
        });

        this.load_theme();

        this._brand_page_timeout_id = 0;

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

            this._window.make_ready(() => {
                this._content_ready = true;
                this._show_home_if_ready();
                cb();
            });
        });
    },

    _update_highlight: function () {
        let item = HistoryStore.get_default().get_current_item();
        if (item.page_type === Pages.SET) {
            Dispatcher.get_default().dispatch({
                action_type: Actions.HIGHLIGHT_ITEM,
                model: item.model,
            });
        }
    },

    _do_search: function (history_item) {
        let dispatcher = Dispatcher.get_default();
        dispatcher.dispatch({
            action_type: Actions.SEARCH_STARTED,
            query: history_item.query,
        });
        dispatcher.dispatch({
            action_type: Actions.SHOW_SEARCH_PAGE,
        });
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

            dispatcher.dispatch({
                action_type: Actions.SEARCH_READY,
                query: history_item.query,
            });
        });

        this._update_highlight();
    },

    _on_history_change: function () {
        let history = HistoryStore.get_default();
        let item = history.get_current_item();
        let dispatcher = Dispatcher.get_default();
        dispatcher.dispatch({
            action_type: Actions.CLEAR_HIGHLIGHTED_ITEM,
            model: item.model,
        });

        switch (item.page_type) {
            case Pages.SET:
                dispatcher.dispatch({
                    action_type: Actions.SHOW_SET,
                    model: item.model,
                });
                dispatcher.dispatch({
                    action_type: Actions.SHOW_SET_PAGE,
                });
                this._update_highlight();
                break;
            case Pages.HOME:
                if (history.get_items().length === 1) {
                    Dispatcher.get_default().dispatch({
                        action_type: Actions.SHOW_BRAND_PAGE,
                    });
                    this._brand_page_timeout_id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this.BRAND_PAGE_TIME_MS, () => {
                        this._brand_page_timeout_id = 0;
                        this._show_home_if_ready();
                        return GLib.SOURCE_REMOVE;
                    });
                } else {
                    this._show_home_if_ready();
                }
                break;
            case Pages.ALL_SETS:
                dispatcher.dispatch({
                    action_type: Actions.SHOW_ALL_SETS_PAGE,
                });
                break;
            case Pages.SEARCH:
                this._do_search(item);
                break;
            case Pages.ARTICLE:
                dispatcher.dispatch({
                    action_type: Actions.FEATURE_ITEM,
                    model: item.model,
                });
                dispatcher.dispatch({
                    action_type: Actions.SHOW_ARTICLE_PAGE,
                    context_label: item.context_label,
                });

                ReadingHistoryModel.get_default().mark_article_read(item.model.ekn_id);

                this._update_highlight();
                break;
        }
    },

    _show_home_if_ready: function () {
        let item = HistoryStore.get_default().get_current_item();
        if (!item || item.page_type !== Pages.HOME)
            return;
        if (!this._content_ready)
            return;
        if (this._brand_page_timeout_id)
            return;
        Dispatcher.get_default().dispatch({
            action_type: Actions.SHOW_HOME_PAGE,
        });

        this._update_highlight();
    },
});
