// Copyright 2015 Endless Mobile, Inc.

/* exported BuffetInteraction */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const HistoryPresenter = imports.app.historyPresenter;
const Interaction = imports.app.interfaces.interaction;
const Launcher = imports.app.interfaces.launcher;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;

const Pages = {
    HOME: 'home',
    SET: 'set',
};

/**
 * Class: BuffetInteraction
 * Interaction that presents all the content and lets the user choose
 *
 * For the Travel app, we serve up all the content at once.
 * The various presentation modules (e.g. <HighlightsModule>) sort it, and the
 * arrangements (e.g. <WindshieldArrangement>) present it in attractive ways.
 * The user can pass along the buffet table, choosing what looks nice.
 *
 * Implements:
 *    <Module>, <Launcher>, <Interaction>
 */
const BuffetInteraction = new Lang.Class({
    Name: 'BuffetInteraction',
    GTypeName: 'EknBuffetInteraction',
    Extends: GObject.Object,
    Implements: [ Module.Module, Launcher.Launcher, Interaction.Interaction ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'application': GObject.ParamSpec.override('application', Interaction.Interaction),
        'template-type': GObject.ParamSpec.override('template-type', Interaction.Interaction),
        'css': GObject.ParamSpec.override('css', Interaction.Interaction),
    },

    BRAND_SCREEN_TIME_MS: 1500,

    _init: function (props={}) {
        this._launched_once = false;

        this.parent(props);

        this._window = this.create_submodule('window', {
            application: this.application,
            template_type: this.template_type,
        });

        this._load_theme();

        this._history_presenter = new HistoryPresenter.HistoryPresenter({
            history_model: new EosKnowledgePrivate.HistoryModel(),
        });

        // Load all sets, with which to populate the highlights and thematic
        // pages
        Engine.get_default().get_objects_by_query(new QueryObject.QueryObject({
            limit: -1,
            tags: ['EknSetObject'],
        }), null, (engine, res) => {
            let models;
            try {
                [models] = engine.get_objects_by_query_finish(res);
            } catch (e) {
                logError(e, 'Failed to load sets from database');
                return;
            }

            Dispatcher.get_default().dispatch({
                action_type: Actions.APPEND_SETS,
                models: models,
            });
        });

        Dispatcher.get_default().register((payload) => {
            switch (payload.action_type) {
                case Actions.HOME_CLICKED:
                    this._history_presenter.set_current_item_from_props({
                        page_type: Pages.HOME,
                    });
                    break;
                case Actions.SET_CLICKED:
                    this._history_presenter.set_current_item_from_props({
                        page_type: Pages.SET,
                        model: payload.model,
                    });
                    break;
            }
        });

        this._history_presenter.set_current_item_from_props({
            page_type: Pages.HOME,
        });
        this._history_presenter.connect('history-item-changed',
            this._on_history_item_change.bind(this));
    },

    _load_theme: function () {
        let provider = new Gtk.CssProvider();
        provider.load_from_resource('/com/endlessm/knowledge/data/css/endless_buffet.css');
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    },

    _on_history_item_change: function (presenter, item, is_going_back) {
        let dispatcher = Dispatcher.get_default();
        dispatcher.dispatch({
            action_type: Actions.HIDE_MEDIA,
        });

        switch (item.page_type) {
            case Pages.SET:
                dispatcher.dispatch({
                    action_type: Actions.SHOW_SET,
                    model: item.model,
                });
                dispatcher.dispatch({
                    action_type: Actions.SHOW_SECTION_PAGE,
                });
                break;
            case Pages.HOME:
                dispatcher.dispatch({
                    action_type: Actions.SHOW_HOME_PAGE,
                });
                break;
        }
    },

    // Helper function for the three Launcher implementation methods. Returns
    // true if an action was really dispatched.
    _dispatch_launch: function (timestamp, launch_type) {
        if (this._launched_once)
            return false;
        this._launched_once = true;

        Dispatcher.get_default().dispatch({
            action_type: Actions.FIRST_LAUNCH,
            timestamp: timestamp,
            launch_type: launch_type,
        });
        return true;
    },

    // Launcher implementation
    desktop_launch: function (timestamp) {
        if (!this._dispatch_launch(timestamp, Launcher.LaunchType.DESKTOP))
            return;
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, this.BRAND_SCREEN_TIME_MS, () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.BRAND_SCREEN_DONE,
            });
            return GLib.SOURCE_REMOVE;
        });
    },

    // Launcher override
    search: function (timestamp, query) {
        this._dispatch_launch(timestamp, Launcher.LaunchType.SEARCH);
    },

    // Launcher override
    activate_search_result: function (timestamp, ekn_id, query) {
        this._dispatch_launch(timestamp, Launcher.LaunchType.SEARCH_RESULT);
    },

    // Module override
    get_slot_names: function () {
        return ['window'];
    },
});
