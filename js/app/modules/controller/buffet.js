// Copyright 2015 Endless Mobile, Inc.

/* exported Buffet */

const GObject = imports.gi.GObject;

const BuffetHistoryStore = imports.app.buffetHistoryStore;
const Engine = imports.search.engine;
const Controller = imports.app.interfaces.controller;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const Pages = imports.app.pages;
const ReadingHistoryModel = imports.app.readingHistoryModel;
const SetMap = imports.app.setMap;
const QueryObject = imports.search.queryObject;

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
        // Load all sets, with which to populate the set map
        // FIXME: deduplicate this with Selection.AllSets
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

    _on_history_change: function () {
        let item = HistoryStore.get_default().get_current_item();
        switch (item.page_type) {
            case Pages.ARTICLE:
                ReadingHistoryModel.get_default().mark_article_read(item.model.ekn_id);
                break;
        }
    },
});
