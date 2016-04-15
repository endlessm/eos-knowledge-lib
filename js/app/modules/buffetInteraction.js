// Copyright 2015 Endless Mobile, Inc.

/* exported BuffetInteraction */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const EosMetrics = imports.gi.EosMetrics;
const Gdk = imports.gi.Gdk;
const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

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
const ReadingHistoryModel = imports.app.readingHistoryModel;
const SetMap = imports.app.setMap;
const SetObjectModel = imports.search.setObjectModel;
const QueryObject = imports.search.queryObject;
const Utils = imports.app.utils;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);
let RESOURCE_PATH = '/com/endlessm/knowledge/data/css/';

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
const BuffetInteraction = new Module.Class({
    Name: 'BuffetInteraction',
    GTypeName: 'EknBuffetInteraction',
    Extends: GObject.Object,
    Implements: [ Module.Module, Launcher.Launcher, Interaction.Interaction ],

    Properties: {
        /**
         * Property: theme
         * Theme CSS specification filename
         *
         * The CSS filename that is associated with the app default design.
         *
         * Flags:
         *   Construct only
         */
        'theme': GObject.ParamSpec.string('theme', 'Theme',
            'Theme CSS specification filename',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            'endless_buffet'),
    },

    BRAND_PAGE_TIME_MS: 1500,

    _init: function (props={}) {
        this._launched_once = this._timer_ready = this._content_ready = false;

        this.parent(props);

        this._window = this.create_submodule('window', {
            application: this.application,
            template_type: this.template_type,
        });

        this._load_theme();

        this._history_presenter = new HistoryPresenter.HistoryPresenter({
            history_model: new EosKnowledgePrivate.HistoryModel(),
        });

        this._brand_page_timeout_id = 0;

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

            SetMap.init_map_with_models(models);

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
                case Actions.NEED_MORE_SUPPLEMENTARY_ARTICLES:
                    this._load_more_supplementary_articles(payload);
                    break;
                case Actions.MODULE_READY:
                    this._content_ready = true;
                    this._show_home_if_ready();
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

    _load_more_supplementary_articles: function (payload) {
        let query_props = {
            tag_match: QueryObject.QueryObjectTagMatch.ALL,
        };

        if (payload.need_unread) {
            query_props.excluded_ids = [...ReadingHistoryModel.get_default().get_read_articles()];
        }

        let current_set_tags = payload.set_tags.slice();

        // SupplementaryArticle modules can either show articles from the same category
        // as the current article, or articles from different categories.
        // In the the second case, we want to exclude all articles tagged with
        // the current article's tags.
        if (payload.same_set) {
            current_set_tags.push('EknArticleObject');
            query_props.tags = current_set_tags;
        } else {
            query_props.tags = ['EknArticleObject'];
            query_props.excluded_tags = current_set_tags;
        }

        let query = new QueryObject.QueryObject(query_props);
        Engine.get_default().get_objects_by_query(query, null, (engine, task) => {
            let results, get_more_results_query;
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                logError(error);
                return;
            }

            Dispatcher.get_default().dispatch({
                action_type: Actions.APPEND_SUPPLEMENTARY_ARTICLES,
                models: results,
                same_set: payload.same_set,
                set_tags: payload.set_tags,
                need_unread: payload.need_unread,
            });
        });

        this._update_highlight();
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

        this._update_highlight();
    },

    _load_theme: function () {
        let provider = new Gtk.CssProvider();
        provider.load_from_resource(RESOURCE_PATH + this.theme + '.css');
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        if (this.css) {
            let overrides_provider = new Gtk.CssProvider();
            overrides_provider.load_from_data(this.css);
            Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                overrides_provider,
                Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION + 1);
        }
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

    _update_highlight: function () {
        let item = this._history_presenter.history_model.current_item;
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
            tags: ['EknArticleObject'],
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

        this._update_highlight();
    },

    _on_history_item_change: function (presenter, item, is_going_back) {
        let dispatcher = Dispatcher.get_default();
        dispatcher.dispatch({
            action_type: Actions.HIDE_MEDIA,
        });
        dispatcher.dispatch({
            action_type: Actions.CLEAR_HIGHLIGHTED_ITEM,
            model: item.model,
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
                dispatcher.dispatch({
                    action_type: Actions.CLEAR_SUPPLEMENTARY_ARTICLES,
                    same_set: false,
                });
                this._load_more_supplementary_articles({
                    set_tags: item.model.child_tags,
                    same_set: false,
                    need_unread: true,
                });
                break;
            case Pages.HOME:
                if (this._history_presenter.item_count() === 1) {
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
                dispatcher.dispatch({
                    action_type: Actions.FEATURE_ITEM,
                    model: item.model,
                });
                dispatcher.dispatch(payload);
                dispatcher.dispatch({
                    action_type: Actions.SHOW_ARTICLE_PAGE,
                    context_label: item.context_label,
                });

                ReadingHistoryModel.get_default().mark_article_read(item.model.ekn_id);

                // First load unread articles that are in the same category
                this._load_more_supplementary_articles({
                    set_tags: item.model.tags,
                    same_set: true,
                    need_unread: true,
                });
                // Then also load unread articles from different categories
                this._load_more_supplementary_articles({
                    set_tags: item.model.tags,
                    same_set: false,
                    need_unread: true,
                });
                break;
        }
        dispatcher.dispatch({
            action_type: Actions.SET_SEARCH_TEXT,
            text: search_text,
        });
    },

    _show_home_if_ready: function () {
        let item = this._history_presenter.history_model.current_item;
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
        } else if (model instanceof SetObjectModel.SetObjectModel) {
            this._history_presenter.set_current_item_from_props({
                page_type: Pages.SET,
                model: model,
                context_label: model.title,
            });
        } else if (model instanceof MediaObjectModel.MediaObjectModel) {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SHOW_MEDIA,
                model: model,
            });
        }
    },

    _dispatch_present: function (timestamp) {
        Dispatcher.get_default().dispatch({
            action_type: Actions.PRESENT_WINDOW,
            timestamp: timestamp,
        });
    },

    // Launcher implementation
    desktop_launch: function (timestamp) {
        this._dispatch_present(timestamp);
        this._history_presenter.set_current_item_from_props({
            page_type: Pages.HOME,
        });
    },

    // Launcher override
    search: function (timestamp, query) {
        this._dispatch_present(timestamp);
        this._start_search_via_history(query);
    },

    // Launcher override
    activate_search_result: function (timestamp, ekn_id, query) {
        this._dispatch_present(timestamp);
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
