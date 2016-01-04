// Copyright 2015 Endless Mobile, Inc.

/* exported BuffetInteraction */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const EosMetrics = imports.gi.EosMetrics;
const Gdk = imports.gi.Gdk;
const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const HistoryPresenter = imports.app.historyPresenter;
const Interaction = imports.app.interfaces.interaction;
const Launcher = imports.app.interfaces.launcher;
const MediaObjectModel = imports.search.mediaObjectModel;
const Module = imports.app.interfaces.module;
const SetObjectModel = imports.search.setObjectModel;
const QueryObject = imports.search.queryObject;
const Utils = imports.app.utils;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const Pages = {
    HOME: 'home',
    SET: 'set',
    SEARCH: 'search',
    ARTICLE: 'article',
    ALL_SETS: 'all-sets',
};
const RESULTS_SIZE = 15;
const SEARCH_METRIC_EVENT_ID = 'a628c936-5d87-434a-a57a-015a0f223838';

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
        'subtitle': GObject.ParamSpec.override('subtitle', Interaction.Interaction),
    },

    BRAND_SCREEN_TIME_MS: 1500,

    _init: function (props={}) {
        this._launched_once = this._timer_ready = this._content_ready = false;

        this.parent(props);

        this._window = this.create_submodule('window', {
            application: this.application,
            template_type: this.template_type,
            subtitle: this.subtitle,
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
                        context_label: payload.model.title,
                    });
                    break;
                case Actions.ALL_SETS_CLICKED:
                    this._history_presenter.set_current_item_from_props({
                        page_type: Pages.ALL_SETS,
                    });
                    break;
                case Actions.SEARCH_TEXT_ENTERED:
                    this._start_search_via_history(payload.query);
                    break;
                case Actions.NEED_MORE_SEARCH:
                    this._load_more_results();
                    break;
                case Actions.NEED_MORE_SUGGESTED_ARTICLES:
                    this._load_more_suggestions(payload.query);
                    break;
                case Actions.MODULE_READY:
                    this._content_ready = true;
                    if (this._timer_ready) {
                        Dispatcher.get_default().dispatch({
                            action_type: Actions.BRAND_SCREEN_DONE,
                        });
                    }
                    break;
                case Actions.ARTICLE_LINK_CLICKED:
                    this._load_ekn_id(payload.ekn_id);
                    break;
                case Actions.AUTOCOMPLETE_CLICKED:
                case Actions.ITEM_CLICKED:
                case Actions.SEARCH_CLICKED:
                    if (payload.model instanceof SetObjectModel.SetObjectModel) {
                        this._history_presenter.set_current_item_from_props({
                            page_type: Pages.SET,
                            model: payload.model,
                        });
                    } else {
                        let context_label = '';
                        if (payload.query) {
                            context_label = _("Results were found for “%s”").format(payload.query);
                        } else if (payload.context_label) {
                            context_label = payload.context_label;
                        }
                        this._history_presenter.set_current_item_from_props({
                            page_type: Pages.ARTICLE,
                            model: payload.model,
                            context: payload.context,
                            context_label: context_label,
                        });
                    }
                    break;
                case Actions.PREVIOUS_DOCUMENT_CLICKED:
                case Actions.NEXT_DOCUMENT_CLICKED:
                    let item = this._history_presenter.history_model.current_item;
                    this._history_presenter.set_current_item_from_props({
                        page_type: Pages.ARTICLE,
                        model: payload.model,
                        context: item.context,
                    });
                    break;
            }
        });

        this._history_presenter.connect('history-item-changed',
            this._on_history_item_change.bind(this));
    },

    // this number ought to be the number of articles in database
    // but we don't have a way of getting that so this is just a conservative guess
    _TOTAL_ARTICLES: 50,
    _load_more_suggestions: function (query) {
        let hash = Utils.dumb_hash(query);
        let random_query = new QueryObject.QueryObject({
            offset: hash % this._TOTAL_ARTICLES,
            limit: RESULTS_SIZE,
            sort: QueryObject.QueryObjectSort.ARTICLE_NUMBER,
            tags: ['EknArticleObject'],
        });
        Engine.get_default().get_objects_by_query(random_query, null, (engine, task) => {
            let random_results, get_more_results_query;
            try {
                [random_results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                Dispatcher.get_default().dispatch({
                    action_type: Actions.SEARCH_FAILED,
                    query: item.query,
                    error: error,
                });
                logError(error);
                return;
            }
            // Reseed the pseudorandom function so that we get the same random sequence
            GLib.random_set_seed(hash);
            // Generate a pseudorandom sequence of numbers to use to shuffle the array
            let rand_sequence = Array.apply(null, {length: RESULTS_SIZE}).map(GLib.random_double);
            Dispatcher.get_default().dispatch({
                action_type: Actions.APPEND_SUGGESTED_ARTICLES,
                models: Utils.shuffle(random_results, rand_sequence).slice(0, 4),
            });
        });
    },

    _load_theme: function () {
        let provider = new Gtk.CssProvider();
        provider.load_from_resource('/com/endlessm/knowledge/data/css/endless_buffet.css');
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    },

    _start_search_via_history: function (query) {
        let sanitized_query = Utils.sanitize_query(query);
        if (sanitized_query.length === 0)
            return;

        this.record_search_metric(query);
        this._history_presenter.set_current_item_from_props({
            page_type: Pages.SEARCH,
            query: sanitized_query,
        });
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
        });
        Engine.get_default().get_objects_by_query(query_obj, null, (engine, task) => {
            let results, get_more;
            try {
                [results, get_more] = engine.get_objects_by_query_finish(task);
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
            this._get_more_results_query = get_more;
            dispatcher.dispatch({
                action_type: Actions.CLEAR_SEARCH,
            });
            dispatcher.dispatch({
                action_type: Actions.APPEND_SEARCH,
                models: results,
                query: history_item.query,
            });

            dispatcher.dispatch({
                action_type: Actions.SEARCH_READY,
                query: history_item.query,
            });
        });
    },

    _load_more_results: function () {
        if (!this._get_more_results_query)
            return;
        Engine.get_default().get_objects_by_query(this._get_more_results_query, null, (engine, task) => {
            let results, get_more;
            try {
                [results, get_more] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                logError(error);
                return;
            }

            if (results.length < 1)
                return;

            this._get_more_results_query = get_more;
            Dispatcher.get_default().dispatch({
                action_type: Actions.APPEND_SEARCH,
                models: results,
            });
        });
        // Null the query we just sent to the engine, when results come back
        // we'll have a new more results query. But this keeps us from double
        // loading this query.
        this._get_more_results_query = null;
    },

    _on_history_item_change: function (presenter, item, is_going_back) {
        let dispatcher = Dispatcher.get_default();
        dispatcher.dispatch({
            action_type: Actions.HIDE_MEDIA,
        });

        let search_text = '';
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
            case Pages.ALL_SETS:
                dispatcher.dispatch({
                    action_type: Actions.SHOW_ALL_SETS_PAGE,
                });
                break;
            case Pages.SEARCH:
                this._do_search(item);
                search_text = item.query;
                break;
            case Pages.ARTICLE:
                let animation_type = EosKnowledgePrivate.LoadingAnimationType.FORWARDS_NAVIGATION;
                let last_item = this._history_presenter.history_model.get_item(is_going_back ? 1 : -1);
                if (!last_item || last_item.page_type !== Pages.ARTICLE) {
                    animation_type = EosKnowledgePrivate.LoadingAnimationType.NONE;
                } else if (is_going_back) {
                    animation_type = EosKnowledgePrivate.LoadingAnimationType.BACKWARDS_NAVIGATION;
                }
                let payload = {
                    action_type: Actions.SHOW_ARTICLE,
                    model: item.model,
                    animation_type: animation_type,
                };
                if (item.context) {
                    let index = item.context.indexOf(item.model);
                    if (index > 0)
                        payload.previous_model = item.context[index - 1];
                    if (index < item.context.length - 1)
                        payload.next_model = item.context[index + 1];
                }
                dispatcher.dispatch(payload);
                dispatcher.dispatch({
                    action_type: Actions.SHOW_ARTICLE_PAGE,
                    context_label: item.context_label,
                });
                break;
        }
        dispatcher.dispatch({
            action_type: Actions.SET_SEARCH_TEXT,
            text: search_text,
        });
    },

    _load_ekn_id: function (ekn_id) {
        Engine.get_default().get_object_by_id(ekn_id, null, (engine, task) => {
            let model;
            try {
                model = engine.get_object_by_id_finish(task);
            } catch (error) {
                logError(error);
                return;
            }

            this._load_model(model);
        });
    },

    _load_model: function (model) {
        if (model instanceof ArticleObjectModel.ArticleObjectModel) {
            this._history_presenter.set_current_item_from_props({
                page_type: Pages.ARTICLE,
                model: model,
            });
        } else if (model instanceof MediaObjectModel.MediaObjectModel) {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SHOW_MEDIA,
                model: model,
            });
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
        this._history_presenter.set_current_item_from_props({
            page_type: Pages.HOME,
        });

        if (!this._dispatch_launch(timestamp, Launcher.LaunchType.DESKTOP)) {
            return;
        }

        Dispatcher.get_default().dispatch({
            action_type: Actions.SHOW_BRAND_SCREEN,
        });

        GLib.timeout_add(GLib.PRIORITY_DEFAULT, this.BRAND_SCREEN_TIME_MS, () => {
            this._timer_ready = true;
            if (this._content_ready) {
                Dispatcher.get_default().dispatch({
                    action_type: Actions.BRAND_SCREEN_DONE,
                });
            }
            return GLib.SOURCE_REMOVE;
        });
    },

    // Launcher override
    search: function (timestamp, query) {
        this._start_search_via_history(query);
        this._dispatch_launch(timestamp, Launcher.LaunchType.SEARCH);
    },

    // Launcher override
    activate_search_result: function (timestamp, ekn_id, query) {
        // Show an empty article page while waiting
        Dispatcher.get_default().dispatch({
            action_type: Actions.SHOW_ARTICLE_PAGE,
        });

        Engine.get_default().get_object_by_id(ekn_id, null, (engine, task) => {
            try {
                let model = engine.get_object_by_id_finish(task);
                this._history_presenter.set_current_item_from_props({
                    page_type: Pages.ARTICLE,
                    model: model,
                    query: query,
                });
            } catch (error) {
                logError(error);
            }
            this._dispatch_launch(timestamp, Launcher.LaunchType.SEARCH_RESULT);
        });
    },

    // Module override
    get_slot_names: function () {
        return ['window'];
    },

    // Should be mocked out during tests so that we don't actually send metrics
    record_search_metric: function (query) {
        let recorder = EosMetrics.EventRecorder.get_default();
        recorder.record_event(SEARCH_METRIC_EVENT_ID, new GLib.Variant('(ss)',
            [query, this.application.application_id]));
    },
});
