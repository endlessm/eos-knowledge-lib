// Copyright 2015 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const EosMetrics = imports.gi.EosMetrics;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const ArticleObjectModel = imports.search.articleObjectModel;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const HistoryItem = imports.app.historyItem;
const HistoryPresenter = imports.app.historyPresenter;
const Interaction = imports.app.interfaces.interaction;
const Launcher = imports.app.interfaces.launcher;
const MediaObjectModel = imports.search.mediaObjectModel;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const StyleKnobGenerator = imports.app.compat.styleKnobGenerator;
const TabButton = imports.app.widgets.tabButton;
const TextCard = imports.app.modules.textCard;
const Utils = imports.app.utils;

const DATA_RESOURCE_PATH = 'resource:///com/endlessm/knowledge/data/';
const RESULTS_SIZE = 10;

/**
 * Class: MeshInteraction
 *
 * The Mesh interaction model controls the Encyclopedia and presets formerly
 * known as templates A and B.
 * A very exploratory interaction, the content is organized into categories and
 * may have filters, but can be reached through many different paths.
 */
const MeshInteraction = new Module.Class({
    Name: 'MeshInteraction',
    Extends: GObject.Object,
    Implements: [Launcher.Launcher, Interaction.Interaction],

    ARTICLE_PAGE: 'article',
    HOME_PAGE: 'home',
    SEARCH_PAGE: 'search',
    SECTION_PAGE: 'section',

    SEARCH_METRIC: 'a628c936-5d87-434a-a57a-015a0f223838',
    // Overridable in tests. Brand page should be visible for 2 seconds. The
    // transition is currently hardcoded to a slow fade over 500 ms.
    BRAND_PAGE_TIME_MS: 1500,

    _init: function (props) {
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

        this._current_set_id = null;
        this._current_search_query = '';
        this._set_cancellable = new Gio.Cancellable();
        this._search_cancellable = new Gio.Cancellable();
        this._brand_page_timeout_id = 0;
        this._home_content_loaded = false;

        let dispatcher = Dispatcher.get_default();
        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.SEARCH_TEXT_ENTERED:
                    this._do_search(payload.query);
                    break;
                case Actions.ARTICLE_LINK_CLICKED:
                    this._load_uri(payload.ekn_id);
                    break;
                case Actions.NAV_BACK_CLICKED:
                    this._on_back();
                    break;
                case Actions.HOME_CLICKED:
                    this._history_presenter.set_current_item_from_props({
                        page_type: this.HOME_PAGE,
                    });
                    break;
                case Actions.SET_CLICKED:
                    this._history_presenter.set_current_item_from_props({
                        page_type: this.SECTION_PAGE,
                        model: payload.model,
                    });
                    break;
                case Actions.ITEM_CLICKED:
                case Actions.SEARCH_CLICKED:
                    this._history_presenter.set_current_item_from_props({
                        page_type: this.ARTICLE_PAGE,
                        model: payload.model,
                    });
                    break;
                case Actions.NEED_MORE_ITEMS:
                    this._load_more_set_results();
                    break;
                case Actions.NEED_MORE_SEARCH:
                    this._load_more_search_results();
                    break;
                case Actions.AUTOCOMPLETE_CLICKED:
                    this._history_presenter.set_current_item_from_props({
                        page_type: this.ARTICLE_PAGE,
                        model: payload.model,
                        query: payload.query,
                    });
                    break;
            }
        });

        if (this.template_type !== 'encyclopedia') {
            // Connect signals
            this._window.connect('search-focused', this._on_search_focus.bind(this));
        }

        this._window.connect('key-press-event', this._on_key_press_event.bind(this));
        this._history_presenter.connect('history-item-changed', this._on_history_item_change.bind(this));

        this._load_sets_on_home_page ();
    },

    _load_sets_on_home_page: function () {
        let query_obj = new QueryObject.QueryObject({
            limit: -1,
            tags: [ Engine.HOME_PAGE_TAG ],
        });
        Engine.get_default().get_objects_by_query(query_obj, null, (engine, inner_task) => {
            let [models] = engine.get_objects_by_query_finish(inner_task);

            // FIXME: This sorting should ideally happen in the arrangement
            // once it has a sort-by API.
            let sorted_models = models.sort((a, b) => {
                let sortVal = 0;
                if (a.featured)
                    sortVal--;
                if (b.featured)
                    sortVal++;
                return sortVal;
            });
            Dispatcher.get_default().dispatch({
                action_type: Actions.APPEND_SETS,
                models: sorted_models,
            });
            this._home_content_loaded = true;
            this._show_home_if_ready();
        });
    },

    STYLE_MAP: {
        A: {
            section_card: '.legacy-polaroid-card',
            article_card: '.article-card',
            section_page_banner: '.section-page-a EknSetBannerModule',
            search_page_banner: '.search-page-a EknSearchBannerModule',
            no_search_results_page: '.no-search-results-page-a'
        },
        B: {
            section_card: '.legacy-post-card',
            article_card: '.text-card',
            section_page_banner: '.section-page-b EknSetBannerModule',
            search_page_banner: '.search-page-b EknSearchBannerModule',
            search_page: '.search-page-b',
            no_search_results_page: '.no-search-results-page-b'
        },
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
            case this.SEARCH_PAGE:
                search_text = item.query;
                this._update_search_results(item);
                dispatcher.dispatch({
                    action_type: Actions.SHOW_SEARCH_PAGE,
                });
                break;
            case this.SECTION_PAGE:
                this._update_set_results(item, () => {
                    dispatcher.dispatch({
                        action_type: Actions.SHOW_SECTION_PAGE,
                    });
                });
                break;
            case this.ARTICLE_PAGE:
                if (this.template_type === 'B')
                    this._update_article_list();
                dispatcher.dispatch({
                    action_type: Actions.SHOW_ARTICLE,
                    model: item.model,
                    animation_type: this._get_article_animation_type(item, is_going_back),
                });
                dispatcher.dispatch({
                    action_type: Actions.SHOW_ARTICLE_PAGE,
                });
                break;
            case this.HOME_PAGE:
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
        }
        dispatcher.dispatch({
            action_type: Actions.SET_SEARCH_TEXT,
            text: search_text,
        });
    },

    _show_home_if_ready: function () {
        let item = this._history_presenter.history_model.current_item;
        if (!item || item.page_type !== this.HOME_PAGE)
            return;
        if (!this._home_content_loaded)
            return;
        if (this._brand_page_timeout_id)
            return;
        Dispatcher.get_default().dispatch({
            action_type: Actions.SHOW_HOME_PAGE,
        });
        Dispatcher.get_default().dispatch({
            action_type: Actions.FOCUS_SEARCH,
        });
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

    _get_knob_css: function (css_data) {
        let str = '';
        for (let key in css_data) {
            let module_styles = css_data[key];
            // For now, only TextCard and TabButton have bespoke CSS
            // structure, since they need to use the @define syntax
            if (key === 'article_card' && this.template_type === 'B') {
                str += TextCard.get_css_for_module(module_styles);
            } else if (key === 'tab_button' && this.template_type === 'A') {
                str += TabButton.get_css_for_module(module_styles);
            } else {
                // All other modules can just convert their knobs to CSS strings
                // directly using the STYLE_MAP
                str += Utils.get_css_for_title_and_module(module_styles,
                    this.STYLE_MAP[this.template_type][key] + ' .title',
                    this.STYLE_MAP[this.template_type][key]);
            }
        }
        return str;
    },

    _get_article_animation_type: function (item, is_going_back) {
        let last_item = this._history_presenter.history_model.get_item(is_going_back ? 1 : -1);
        if (!last_item || last_item.page_type !== this.ARTICLE_PAGE)
            return EosKnowledgePrivate.LoadingAnimationType.NONE;
        if (is_going_back)
            return EosKnowledgePrivate.LoadingAnimationType.BACKWARDS_NAVIGATION;
        return EosKnowledgePrivate.LoadingAnimationType.FORWARDS_NAVIGATION;
    },

    _on_home_button_clicked: function (button) {
        this._history_presenter.set_current_item_from_props({
            page_type: this.HOME_PAGE,
        });
    },

    _on_search_focus: function (view, focused) {
        // If the user focused the search box, ensure that the lightbox is hidden
        Dispatcher.get_default().dispatch({
            action_type: Actions.HIDE_MEDIA,
        });
    },

    _on_back: function () {
        let item = this._history_presenter.history_model.current_item;
        let types = item.page_type === this.ARTICLE_PAGE ?
            [this.HOME_PAGE, this.SECTION_PAGE, this.SEARCH_PAGE] : [this.HOME_PAGE];
        let item = this._history_presenter.search_backwards(-1,
            (item) => types.indexOf(item.page_type) >= 0);
        if (!item)
            item = { page_type: this.HOME_PAGE };
        this._history_presenter.set_current_item(HistoryItem.HistoryItem.new_from_object(item));
    },

    _update_article_list: function () {
        this._history_presenter.search_backwards(0, (item) => {
            if (item.query) {
                this._update_search_results(item);
                return true;
            }
            if (item.page_type === this.SECTION_PAGE) {
                this._update_set_results(item);
                return true;
            }
            return false;
        });
        this._update_highlight();
    },

    _update_search_results: function (item) {
        let query_obj = new QueryObject.QueryObject({
            query: item.query,
            limit: RESULTS_SIZE,
            tags: ['EknArticleObject'],
        });
        let dispatcher = Dispatcher.get_default();
        if (this._current_search_query === item.query) {
            dispatcher.dispatch({
                action_type: Actions.SEARCH_READY,
                query: item.query,
            });
            return;
        }
        this._current_search_query = item.query;

        dispatcher.dispatch({
            action_type: Actions.SEARCH_STARTED,
            query: item.query,
        });
        this._search_cancellable.cancel();
        this._search_cancellable.reset();
        this._more_search_results_query = null;
        Engine.get_default().get_objects_by_query(query_obj, this._search_cancellable, (engine, task) => {
            let results, get_more_results_query;
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                if (error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
                    return;
                logError(error);
                dispatcher.dispatch({
                    action_type: Actions.SEARCH_FAILED,
                    query: item.query,
                    error: new Error('Search failed for unknown reason'),
                });
                return;
            }
            this._more_search_results_query = get_more_results_query;

            dispatcher.dispatch({
                action_type: Actions.CLEAR_SEARCH,
            });
            dispatcher.dispatch({
                action_type: Actions.APPEND_SEARCH,
                models: results,
                query: item.query,
            });
            this._update_highlight();
            dispatcher.dispatch({
                action_type: Actions.SEARCH_READY,
                query: item.query,
            });
        });
    },

    _load_more_search_results: function () {
        if (!this._more_search_results_query)
            return;
        Engine.get_default().get_objects_by_query(this._more_search_results_query, this._search_cancellable, (engine, task) => {
            let results, get_more_results_query;
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                if (error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
                    return;
                logError(error);
                return;
            }
            if (!results)
                return;

            let dispatcher = Dispatcher.get_default();
            this._update_highlight();
            dispatcher.dispatch({
                action_type: Actions.APPEND_SEARCH,
                models: results,
            });
            this._more_search_results_query = get_more_results_query;
        });
        // Null the query to avoid double loading.
        this._more_search_results_query = null;
    },

    _update_set_results: function (item, callback=() => {}) {
        let query_obj = new QueryObject.QueryObject({
            tags: item.model.child_tags,
            limit: RESULTS_SIZE,
        });

        let dispatcher = Dispatcher.get_default();
        if (this._current_set_id === item.model.ekn_id) {
            dispatcher.dispatch({
                action_type: Actions.SET_READY,
                model: item.model,
            });
            callback();
            return;
        }
        this._current_set_id = item.model.ekn_id;

        dispatcher.dispatch({
            action_type: Actions.SHOW_SET,
            model: item.model,
        });
        this._set_cancellable.cancel();
        this._set_cancellable.reset();
        this._more_set_results_query = null;
        Engine.get_default().get_objects_by_query(query_obj, this._set_cancellable, (engine, task) => {
            let results, get_more_results_query;
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                if (error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
                    return;
                logError(error);
                callback();
                return;
            }
            this._more_set_results_query = get_more_results_query;

            dispatcher.dispatch({
                action_type: Actions.CLEAR_ITEMS,
            });
            dispatcher.dispatch({
                action_type: Actions.APPEND_ITEMS,
                models: results,
            });
            this._update_highlight();
            dispatcher.dispatch({
                action_type: Actions.SET_READY,
                model: item.model,
            });
            callback();
        });
    },

    _load_more_set_results: function () {
        if (!this._more_set_results_query)
            return;
        Engine.get_default().get_objects_by_query(this._more_set_results_query, this._set_cancellable, (engine, task) => {
            let results, get_more_results_query;
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                if (!error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
                    logError(error);
                return;
            }
            if (!results)
                return;

            let dispatcher = Dispatcher.get_default();
            this._update_highlight();
            dispatcher.dispatch({
                action_type: Actions.APPEND_ITEMS,
                models: results,
            });
            this._more_set_results_query = get_more_results_query;
        });
        // Null the query to avoid double loading.
        this._more_set_results_query = null;
    },

    _update_highlight: function () {
        let item = this._history_presenter.history_model.current_item;
        if (item.page_type === this.ARTICLE_PAGE) {
            Dispatcher.get_default().dispatch({
                action_type: Actions.HIGHLIGHT_ITEM,
                model: item.model,
            });
        }
    },

    /*
     * FIXME: This function will change once we have finalized the structure
     * of the app.json. Load both the base library css styles and the theme specific
     * styles. Make sure to apply the theme styling second, so that
     * it gets priority.
     */
    _load_theme: function () {
        let provider = new Gtk.CssProvider();
        if (this.factory.version >= 2) {
            provider.load_from_data(this.css);
        } else if (this.template_type === 'encyclopedia') {
            let css_file = Gio.File.new_for_uri(DATA_RESOURCE_PATH + 'css/endless_encyclopedia.css');
            provider.load_from_file(css_file);
        } else {
            this._style_knobs = StyleKnobGenerator.get_knobs_from_css(this.css, this.template_type);
            let css_path = Gio.File.new_for_uri(DATA_RESOURCE_PATH).get_child('css');
            let css_files = [css_path.get_child('endless_knowledge.css')];
            // FIXME: Get theme from app.json once we have finalized that
            let theme = this.template_type === 'A' ? 'templateA' : undefined;
            if (typeof theme !== 'undefined') {
                css_files.push(css_path.get_child('themes').get_child(theme + '.css'));
            }
            let all_css = css_files.reduce((str, css_file) => {
                return str + css_file.load_contents(null)[1];
            }, '');
            all_css += this._get_knob_css(this._style_knobs);
            provider.load_from_data(all_css);
        }
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    },

    _do_search: function (query) {
        let sanitized_query = Utils.sanitize_query(query);
        if (sanitized_query.length === 0)
            return;

        this._record_search_metric(query);
        this._history_presenter.set_current_item_from_props({
            page_type: this.SEARCH_PAGE,
            query: sanitized_query,
        });
    },

    // Should be mocked out during tests so that we don't actually send metrics
    _record_search_metric: function (query) {
        let recorder = EosMetrics.EventRecorder.get_default();
        recorder.record_event(this.SEARCH_METRIC, new GLib.Variant('(ss)',
            [query, this.application.application_id]));
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
            page_type: this.HOME_PAGE,
        });
    },

    // Launcher implementation
    search: function (timestamp, query) {
        this._dispatch_present(timestamp);
        this._do_search(query);
    },

    // Launcher implementation
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
                    page_type: this.ARTICLE_PAGE,
                    model: model,
                    query: query,
                });
            } catch (error) {
                logError(error);
            }
        });
    },

    _load_uri: function (ekn_id) {
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
                page_type: this.ARTICLE_PAGE,
                model: model,
            });
        } else if (model instanceof MediaObjectModel.MediaObjectModel) {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SHOW_MEDIA,
                model: model,
            });
        }
    },
});
