// Copyright 2015 Endless Mobile, Inc.

/* exported Buffet */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const HistoryStore = imports.app.historyStore;
const Controller = imports.app.interfaces.controller;
const Launcher = imports.app.interfaces.launcher;
const MediaObjectModel = imports.search.mediaObjectModel;
const Module = imports.app.interfaces.module;
const ReadingHistoryModel = imports.app.readingHistoryModel;
const SetMap = imports.app.setMap;
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
 *    <Module>, <Launcher>, <Controller>
 */
const Buffet = new Module.Class({
    Name: 'Controller.Buffet',
    Extends: GObject.Object,
    Implements: [Launcher.Launcher, Controller.Controller],

    BRAND_PAGE_TIME_MS: 1500,

    _init: function (props={}) {
        this._launched_once = this._timer_ready = this._content_ready = false;

        this.parent(props);

        this._window = this.create_submodule('window', {
            application: this.application,
            visible: false,
        });

        this.load_theme();

        this.history_store = new HistoryStore.HistoryStore();

        this._brand_page_timeout_id = 0;


        Dispatcher.get_default().register((payload) => {
            switch (payload.action_type) {
                case Actions.HOME_CLICKED:
                    this.history_store.set_current_item_from_props({
                        page_type: Pages.HOME,
                    });
                    break;
                case Actions.SET_CLICKED:
                    this.history_store.set_current_item_from_props({
                        page_type: Pages.SET,
                        model: payload.model,
                        context_label: payload.model.title,
                    });
                    break;
                case Actions.ALL_SETS_CLICKED:
                    this.history_store.set_current_item_from_props({
                        page_type: Pages.ALL_SETS,
                    });
                    break;
                case Actions.SEARCH_TEXT_ENTERED:
                    this._start_search_via_history(payload.query);
                    break;
                case Actions.NEED_MORE_SEARCH:
                    this._load_more_results();
                    break;
                case Actions.NEED_MORE_SUPPLEMENTARY_ARTICLES:
                    this._load_more_supplementary_articles(payload);
                    break;
                case Actions.ARTICLE_LINK_CLICKED:
                    this._load_ekn_id(payload.ekn_id);
                    break;
                case Actions.AUTOCOMPLETE_CLICKED:
                case Actions.ITEM_CLICKED:
                case Actions.SEARCH_CLICKED:
                    if (payload.model instanceof SetObjectModel.SetObjectModel) {
                        this.history_store.set_current_item_from_props({
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
                        this.history_store.set_current_item_from_props({
                            page_type: Pages.ARTICLE,
                            model: payload.model,
                            context: payload.context,
                            context_label: context_label,
                        });
                    }
                    break;
                case Actions.PREVIOUS_DOCUMENT_CLICKED:
                case Actions.NEXT_DOCUMENT_CLICKED:
                    let item = this.history_store.get_current_item();
                    this.history_store.set_current_item_from_props({
                        page_type: Pages.ARTICLE,
                        model: payload.model,
                        context: item.context,
                    });
                    break;
            }
        });

        this.history_store.connect('history-item-changed',
            this._on_history_item_change.bind(this));
    },

    make_ready: function (cb) {
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

            Dispatcher.get_default().dispatch({
                action_type: Actions.APPEND_SETS,
                models: models,
            });
        });
        this._window.make_ready(() => {
            this._content_ready = true;
            this._show_home_if_ready();
        });
    },

    _load_more_supplementary_articles: function (payload) {
        let query_props = {
            sort: QueryObject.QueryObjectSort.SEQUENCE_NUMBER,
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
            query_props.tags_match_all = current_set_tags;
        } else {
            query_props.excluded_tags = current_set_tags;
            query_props.tags_match_all = ['EknArticleObject'];
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

    _start_search_via_history: function (query) {
        let sanitized_query = Utils.sanitize_query(query);
        if (sanitized_query.length === 0)
            return;

        Utils.record_search_metric(query);
        this.history_store.set_current_item_from_props({
            page_type: Pages.SEARCH,
            query: sanitized_query,
        });
    },

    _update_highlight: function () {
        let item = this.history_store.get_current_item();
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

    _on_history_item_change: function (presenter, item, last_item, is_going_back) {
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
                if (this.history_store.item_count() === 1) {
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
        let item = this.history_store.get_current_item();
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
            this.history_store.set_current_item_from_props({
                page_type: Pages.ARTICLE,
                model: model,
            });
        } else if (model instanceof SetObjectModel.SetObjectModel) {
            this.history_store.set_current_item_from_props({
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
        this.history_store.set_current_item_from_props({
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
                this.history_store.set_current_item_from_props({
                    page_type: Pages.ARTICLE,
                    model: model,
                    query: query,
                });
            } catch (error) {
                logError(error);
            }
        });
    },
});
