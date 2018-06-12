// Copyright 2015 Endless Mobile, Inc.

/* exported Course */

const GObject = imports.gi.GObject;

const CourseHistoryStore = imports.framework.courseHistoryStore;
const Controller = imports.framework.interfaces.controller;
const HistoryStore = imports.framework.historyStore;
const Module = imports.framework.interfaces.module;

/**
 * Class: Course
 * Controller that presents content as a course to be consumed.
 *
 */
var Course = new Module.Class({
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
    },
});
