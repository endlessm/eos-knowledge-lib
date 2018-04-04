// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;

const Controller = imports.app.interfaces.controller;
const HistoryStore = imports.app.historyStore;
const MeshHistoryStore = imports.app.meshHistoryStore;
const Module = imports.app.interfaces.module;

/**
 * Class: Mesh
 *
 * The Mesh controller model controls the Encyclopedia, Library and B presets.
 * A very exploratory controller, the content is organized into categories and
 * may have filters, but can be reached through many different paths.
 */
var Mesh = new Module.Class({
    Name: 'Controller.Mesh',
    Extends: GObject.Object,
    Implements: [Controller.Controller],

    _init: function (props) {
        this.parent(props);

        let history = new MeshHistoryStore.MeshHistoryStore();
        HistoryStore.set_default(history);

        this._window = this.create_submodule('window', {
            application: this.application,
            visible: false,
        });

        this.load_theme();
    },
});
