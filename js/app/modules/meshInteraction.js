// Copyright 2015 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const EosMetrics = imports.gi.EosMetrics;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const ArticleHTMLRenderer = imports.app.articleHTMLRenderer;
const ArticleObjectModel = imports.search.articleObjectModel;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const HistoryItem = imports.app.historyItem;
const HistoryPresenter = imports.app.historyPresenter;
const Interaction = imports.app.interfaces.interaction;
const Launcher = imports.app.launcher;
const MediaObjectModel = imports.search.mediaObjectModel;
const Module = imports.app.interfaces.module;
const QueryObject = imports.search.queryObject;
const StyleKnobGenerator = imports.app.compat.styleKnobGenerator;
const TabButton = imports.app.widgets.tabButton;
const TextCard = imports.app.modules.textCard;
const Utils = imports.app.utils;
const WebkitContextSetup = imports.app.webkitContextSetup;

const DATA_RESOURCE_PATH = 'resource:///com/endlessm/knowledge/';
const RESULTS_SIZE = 10;

/**
 * Class: MeshInteraction
 *
 * The Mesh interaction model controls the Encyclopedia and presets formerly
 * known as templates A and B.
 * A very exploratory interaction, the content is organized into categories and
 * may have filters, but can be reached through many different paths.
 */
const MeshInteraction = new Lang.Class({
    Name: 'MeshInteraction',
    GTypeName: 'EknMeshInteraction',
    Extends: GObject.Object,
    Implements: [ Module.Module, Launcher.Launcher, Interaction.Interaction ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'application': GObject.ParamSpec.override('application', Interaction.Interaction),
        'engine': GObject.ParamSpec.override('engine', Interaction.Interaction),
        'view': GObject.ParamSpec.override('view', Interaction.Interaction),
        'template-type': GObject.ParamSpec.override('template-type', Interaction.Interaction),
        'css': GObject.ParamSpec.override('css', Interaction.Interaction),
    },

    ARTICLE_PAGE: 'article',
    HOME_PAGE: 'home',
    SEARCH_PAGE: 'search',
    SECTION_PAGE: 'section',

    SEARCH_METRIC: 'a628c936-5d87-434a-a57a-015a0f223838',

    _init: function (props) {
        this._launched_once = false;

        // Needs to happen before before any webviews are created
        WebkitContextSetup.register_webkit_extensions(props.application.application_id);
        WebkitContextSetup.register_webkit_uri_handlers(this._article_render_callback.bind(this));

        props.engine = props.engine || Engine.Engine.get_default();

        props.view = props.view || props.factory.create_named_module('window', {
            application: props.application,
            template_type: props.template_type,
        });

        this.parent(props);

        this.load_theme();

        this._history_presenter = new HistoryPresenter.HistoryPresenter({
            history_model: new EosKnowledgePrivate.HistoryModel(),
        });

        this._renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer();

        let dispatcher = Dispatcher.get_default();
        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.SEARCH_TEXT_ENTERED:
                    this.do_search(payload.text);
                    break;
                case Actions.ARTICLE_LINK_CLICKED:
                    this.load_uri(payload.ekn_id);
                    break;
            }
        });

        this._history_presenter.set_current_item_from_props({
            page_type: this.HOME_PAGE,
        });

        if (this.template_type === 'encyclopedia') {
            dispatcher.register((payload) => {
                switch(payload.action_type) {
                    case Actions.AUTOCOMPLETE_CLICKED:
                        this.load_uri(payload.model.ekn_id);
                        break;
                    case Actions.SEARCH_CLICKED:
                        this.load_model(payload.model);
                        break;
                }
            });
        } else {
            let query_obj = new QueryObject.QueryObject({
                limit: 100,  // FIXME arbitrary, can we say "no limit"?
                tags: [ Engine.HOME_PAGE_TAG ],
            });
            this.engine.get_objects_by_query(query_obj, null, (engine, res) => {
                let [models, get_more] = engine.get_objects_by_query_finish(res);
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
                dispatcher.dispatch({
                    action_type: Actions.APPEND_SETS,
                    models: sorted_models,
                });
            });

            this._current_article_results_item = null;

            // Connect signals
            this.view.connect('search-focused', this._on_search_focus.bind(this));

            dispatcher.register((payload) => {
                switch(payload.action_type) {
                    case Actions.NAV_BACK_CLICKED:
                        this._on_back();
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
                        this._load_more_results(Actions.APPEND_ITEMS);
                        break;
                    case Actions.NEED_MORE_SEARCH:
                        this._load_more_results(Actions.APPEND_SEARCH);
                        break;
                    case Actions.AUTOCOMPLETE_CLICKED:
                        this._history_presenter.set_current_item_from_props({
                            page_type: this.ARTICLE_PAGE,
                            model: payload.model,
                            query: payload.text,
                        });
                        break;                }
            });
        }

        dispatcher.dispatch({
            action_type: Actions.FOCUS_SEARCH,
        });

        this.view.connect('key-press-event', this._on_key_press_event.bind(this));
        this._history_presenter.connect('history-item-changed', this._on_history_item_change.bind(this));
    },

    STYLE_MAP: {
        A: {
            section_card: '.card-a',
            article_card: '.article-card',
            section_page: '.section-page-a',
            search_page: '.search-page-a',
            no_search_results_page: '.no-search-results-page-a'
        },
        B: {
            section_card: '.card-b',
            article_card: '.text-card',
            section_page: '.section-page-b',
            search_page: '.search-page-b',
            no_search_results_page: '.no-search-results-page-b'
        },
    },

    _article_render_callback: function (article_model) {
        return this._renderer.render(article_model, {
            enable_scroll_manager: this.template_type === 'A',
            show_title: this.template_type !== 'A',
        });
    },

    _on_history_item_change: function (presenter, item, is_going_back) {
        let dispatcher = Dispatcher.get_default();
        dispatcher.dispatch({
            action_type: Actions.HIDE_MEDIA,
        });

        let search_text = '';
        if (this.template_type === 'encyclopedia') {
            search_text = item.query;
            switch (item.page_type) {
                case this.ARTICLE_PAGE:
                    dispatcher.dispatch({
                        action_type: Actions.SHOW_ARTICLE,
                        model: item.model,
                        animation_type: EosKnowledgePrivate.LoadingAnimation.NONE,
                    });
                    dispatcher.dispatch({
                        action_type: Actions.SHOW_ARTICLE_PAGE,
                    });
                    return;
                case this.SEARCH_PAGE:
                    this._do_search_in_view(item);
                    return;
                case this.HOME_PAGE:
                    dispatcher.dispatch({
                        action_type: Actions.SHOW_HOME_PAGE,
                    });
                    return;
            }
        } else {
            dispatcher.dispatch({
                action_type: Actions.CLEAR_HIGHLIGHTED_ITEM,
                model: item.model,
            });

            switch (item.page_type) {
                case this.SEARCH_PAGE:
                    dispatcher.dispatch({
                        action_type: Actions.SEARCH_STARTED,
                        query: item.query,
                    });
                    dispatcher.dispatch({
                        action_type: Actions.SHOW_SEARCH_PAGE,
                    });
                    this._refresh_article_results(item, (success) => {
                        if (!success) {
                            dispatcher.dispatch({
                                action_type: Actions.SEARCH_FAILED,
                                query: item.query,
                                error: new Error('Search failed for unknown reason'),
                            });
                            dispatcher.dispatch({
                                action_type: Actions.SHOW_SEARCH_PAGE,
                            });
                            return;
                        }
                        dispatcher.dispatch({
                            action_type: Actions.SEARCH_READY,
                            query: item.query,
                        });
                    });
                    search_text = item.query;
                    break;
                case this.SECTION_PAGE:
                    dispatcher.dispatch({
                        action_type: Actions.SHOW_SET,
                        model: item.model,
                    });
                    this._refresh_article_results(item, () => {
                        dispatcher.dispatch({
                            action_type: Actions.SET_READY,
                            model: item.model,
                        });
                        dispatcher.dispatch({
                            action_type: Actions.SHOW_SECTION_PAGE,
                        });
                    });
                    break;
                case this.ARTICLE_PAGE:
                    this._load_document_card_in_view(item, is_going_back);
                    break;
                case this.HOME_PAGE:
                    dispatcher.dispatch({
                        action_type: Actions.SHOW_HOME_PAGE,
                    });
                    break;
            }
        }
        dispatcher.dispatch({
            action_type: Actions.SET_SEARCH_TEXT,
            text: search_text,
        });
    },

    _do_search_in_view: function (item) {
        Dispatcher.get_default().dispatch({
            action_type: Actions.SEARCH_STARTED,
            query: item.query,
        });

        Dispatcher.get_default().dispatch({
            action_type: Actions.SHOW_SEARCH_PAGE,
        });
        this.view.set_focus_child(null);
        let query_obj = new QueryObject.QueryObject({
            query: item.query,
        });
        this.engine.get_objects_by_query(query_obj, null, (engine, task) => {
            let results, get_more_results_query;
            let dispatcher = Dispatcher.get_default();

            dispatcher.dispatch({
                action_type: Actions.CLEAR_SEARCH,
            });

            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                logError(error);
                dispatcher.dispatch({
                    action_type: Actions.SEARCH_FAILED,
                    query: item.query,
                    error: error,
                });
                return;
            }

            dispatcher.dispatch({
                action_type: Actions.APPEND_SEARCH,
                models: results,
            });
            dispatcher.dispatch({
                action_type: Actions.SEARCH_READY,
                query: item.query,
            });
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
            let title_data = Utils.get_css_for_submodule('title', module_styles);
            let module_data = Utils.get_css_for_submodule('module', module_styles);

            // For now, only TextCard and TabButton have bespoke CSS
            // structure, since they need to use the @define syntax
            if (key === 'article_card' && this.template_type === 'B') {
                str += TextCard.get_css_for_module(module_styles);
            } else if (key === 'tab_button' && this.template_type === 'A') {
                str += TabButton.get_css_for_module(module_styles);
            } else {
                // All other modules can just convert their knobs to CSS strings
                // directly using the STYLE_MAP
                str += Utils.object_to_css_string(title_data, this.STYLE_MAP[this.template_type][key] + ' .title') + '\n';
                str += Utils.object_to_css_string(module_data, this.STYLE_MAP[this.template_type][key]) + '\n';
            }
        }
        return str;
    },

    _load_more_results: function (action_type) {
        if (!this._get_more_results_query)
            return;
        this.engine.get_objects_by_query(this._get_more_results_query, null, (engine, task) => {
            let results, get_more_results_query;
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                logError(error);
                return;
            }

            if (results.length > 0) {
                let dispatcher = Dispatcher.get_default();
                let item = this._history_presenter.history_model.current_item;
                if (item.page_type === this.ARTICLE_PAGE) {
                    dispatcher.dispatch({
                        action_type: Actions.HIGHLIGHT_ITEM,
                        model: item.model,
                    });
                }
                dispatcher.dispatch({
                    action_type: action_type,
                    models: results,
                });
            }
            this._get_more_results_query = get_more_results_query;
        });
        // Null the query we just sent to the engine, when results come back
        // we'll have a new more results query. But this keeps us from double
        // loading this query.
        this._get_more_results_query = null;
    },

    _load_document_card_in_view: function (item, is_going_back) {
        let dispatcher = Dispatcher.get_default();
        let animation_type = EosKnowledgePrivate.LoadingAnimationType.FORWARDS_NAVIGATION;
        if (this.view.get_visible_page() !== this.view.article_page) {
            animation_type = EosKnowledgePrivate.LoadingAnimationType.NONE;
            dispatcher.dispatch({
                action_type: Actions.SHOW_ARTICLE_PAGE,
            });
        } else if (is_going_back) {
            animation_type = EosKnowledgePrivate.LoadingAnimationType.BACKWARDS_NAVIGATION;
        }
        dispatcher.dispatch({
            action_type: Actions.SHOW_ARTICLE,
            model: item.model,
            animation_type: animation_type,
        });
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
        let types = this.view.get_visible_page() === this.view.article_page ?
            [this.HOME_PAGE, this.SECTION_PAGE, this.SEARCH_PAGE] : [this.HOME_PAGE];
        let item = this._history_presenter.search_backwards(-1,
            (item) => types.indexOf(item.page_type) >= 0);
        this._history_presenter.set_current_item(HistoryItem.HistoryItem.new_from_object(item));
    },

    // Callback is called with a boolean argument; true if the search was
    // successful (even if no results), false if there was an error
    _refresh_article_results: function (item, callback) {
        let query_obj = null;
        if (item.page_type === this.SECTION_PAGE) {
            let tags = item.model.tags.slice();
            let home_page_tag_index = tags.indexOf(Engine.HOME_PAGE_TAG);
            if (home_page_tag_index !== -1)
                tags.splice(home_page_tag_index, 1);

            query_obj = new QueryObject.QueryObject({
                tags: tags,
                limit: RESULTS_SIZE,
            });
        } else if (item.query) {
            query_obj = new QueryObject.QueryObject({
                query: item.query,
                limit: RESULTS_SIZE,
            });
        } else {
            printerr('No way to query for this history item.');
            callback(false);
            return;
        }

        if (this._current_article_results_item === item) {
            callback(true);
            return;
        }
        this._current_article_results_item = item;

        this.engine.get_objects_by_query(query_obj, null, (engine, task) => {
            let results, get_more_results_query;
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                logError(error);
                callback(false);
                return;
            }
            this._get_more_results_query = get_more_results_query;

            let dispatcher = Dispatcher.get_default();
            if (item.page_type === this.SEARCH_PAGE) {
                dispatcher.dispatch({
                    action_type: Actions.CLEAR_SEARCH,
                });
                dispatcher.dispatch({
                    action_type: Actions.APPEND_SEARCH,
                    models: results,
                });
            } else {
                dispatcher.dispatch({
                    action_type: Actions.CLEAR_ITEMS,
                });
                dispatcher.dispatch({
                    action_type: Actions.APPEND_ITEMS,
                    models: results,
                });
            }
            callback(true);
        });
    },

    /*
     * FIXME: This function will change once we have finalized the structure
     * of the app.json. Load both the base library css styles and the theme specific
     * styles. Make sure to apply the theme styling second, so that
     * it gets priority.
     */
    load_theme: function () {
        let provider = new Gtk.CssProvider();
        if (this.template_type === 'encyclopedia') {
            let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/css/endless_encyclopedia.css');
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

    do_search: function (query) {
        let sanitized_query = Utils.sanitize_query(query);
        if (sanitized_query.length === 0)
            return;

        this.record_search_metric(query);
        this._history_presenter.set_current_item_from_props({
            page_type: this.SEARCH_PAGE,
            query: sanitized_query,
        });
    },

    // Should be mocked out during tests so that we don't actually send metrics
    record_search_metric: function (query) {
        let recorder = EosMetrics.EventRecorder.get_default();
        recorder.record_event(this.SEARCH_METRIC, new GLib.Variant('(ss)',
            [query, this.application.application_id]));
    },

    // Helper function for the three Launcher implementation methods.
    _dispatch_launch: function (timestamp, launch_type) {
        if (this._launched_once)
            return;
        this._launched_once = true;

        Dispatcher.get_default().dispatch({
            action_type: Actions.FIRST_LAUNCH,
            timestamp: timestamp,
            launch_type: launch_type,
        });
    },

    // Launcher implementation
    desktop_launch: function (timestamp) {
        this._dispatch_launch(timestamp, Launcher.LaunchType.DESKTOP);
    },

    // Launcher implementation
    search: function (timestamp, query) {
        this.do_search(query);
        this._dispatch_launch(timestamp, Launcher.LaunchType.SEARCH);
    },

    // Launcher implementation
    activate_search_result: function (timestamp, ekn_id, query) {
        this.engine.get_object_by_id(ekn_id, null, (engine, task) => {
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
        this._dispatch_launch(timestamp, Launcher.LaunchType.SEARCH_RESULT);
    },

    load_uri: function (ekn_id) {
        this.engine.get_object_by_id(ekn_id, null, (engine, task) => {
            let model;
            try {
                model = engine.get_object_by_id_finish(task);
            } catch (error) {
                logError(error);
                return;
            }

            this.load_model(model);
        });
    },

    load_model: function (model) {
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
