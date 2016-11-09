// Copyright 2015 Endless Mobile, Inc.

/* exported Course */

const GObject = imports.gi.GObject;

const CourseHistoryStore = imports.app.courseHistoryStore;
const Engine = imports.search.engine;
const Controller = imports.app.interfaces.controller;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const Pages = imports.app.pages;
const ReadingHistoryModel = imports.app.readingHistoryModel;
const SetMap = imports.app.setMap;
const QueryObject = imports.search.queryObject;

/**
 * Class: Course
 * Controller that presents content as a course to be consumed.
 *
 */
const Course = new Module.Class({
    Name: 'Controller.Course',
    Extends: GObject.Object,
    Implements: [Controller.Controller],

    _init: function (props={}) {
        this.parent(props);

        let history = new CourseHistoryStore.CourseHistoryStore();
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
            tags_match_all: ['EknSetObject'],
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
        if (item.media_model) {
            item.media_model.read = true;
        }
    },
});
