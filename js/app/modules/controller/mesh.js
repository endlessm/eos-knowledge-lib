// Copyright 2015 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Controller = imports.app.interfaces.controller;
const HistoryStore = imports.app.historyStore;
const MeshHistoryStore = imports.app.meshHistoryStore;
const Module = imports.app.interfaces.module;

/**
 * Class: Mesh
 *
 * The Mesh controller model controls the Encyclopedia and presets formerly
 * known as templates A and B.
 * A very exploratory controller, the content is organized into categories and
 * may have filters, but can be reached through many different paths.
 */
const Mesh = new Module.Class({
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

        this._window.connect('key-press-event', this._on_key_press_event.bind(this));
    },

    make_ready: function (cb=function () {}) {
        this._window.make_ready(cb);
    },

    _on_key_press_event: function (widget, event) {
        let keyval = event.get_keyval()[1];
        let state = event.get_state()[1];

        let dispatcher = Dispatcher.get_default();
        if (keyval === Gdk.KEY_Escape) {
            dispatcher.dispatch({
                action_type: Actions.HIDE_ARTICLE_SEARCH,
            });
        } else if (((state & Gdk.ModifierType.CONTROL_MASK) !== 0) &&
                    keyval === Gdk.KEY_f) {
            dispatcher.dispatch({
                action_type: Actions.SHOW_ARTICLE_SEARCH,
            });
        }
    },
});
