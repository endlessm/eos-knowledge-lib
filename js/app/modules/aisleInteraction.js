// Copyright 2015 Endless Mobile, Inc.

/* exported AisleInteraction */

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const EosMetrics = imports.gi.EosMetrics;
const Gdk = imports.gi.Gdk;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const ArchiveNotice = imports.app.widgets.archiveNotice;
const ArticleObjectModel = imports.search.articleObjectModel;
const ArticleSnippetCard = imports.app.modules.articleSnippetCard;
const BackCover = imports.app.modules.backCover;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const HistoryPresenter = imports.app.historyPresenter;
const Interaction = imports.app.interfaces.interaction;
const Launcher = imports.app.interfaces.launcher;
const MediaObjectModel = imports.search.mediaObjectModel;
const Module = imports.app.interfaces.module;
const ProgressLabel = imports.app.widgets.progressLabel;
const QueryObject = imports.search.queryObject;
const ReaderCard = imports.app.modules.readerCard;
const ReaderDocumentCard = imports.app.modules.readerDocumentCard;
const SidebarTemplate = imports.app.modules.sidebarTemplate;
const StyleClasses = imports.app.styleClasses;
const StyleKnobGenerator = imports.app.compat.styleKnobGenerator;
const AisleUserSettingsModel = imports.app.aisleUserSettingsModel;
const Utils = imports.app.utils;
const WebviewTooltipPresenter = imports.app.webviewTooltipPresenter;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);
GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

const RESULTS_SIZE = 15;
const TOTAL_ARTICLES = 30;
const NUM_OVERVIEW_SNIPPETS = 3;

const DATA_RESOURCE_PATH = 'resource:///com/endlessm/knowledge/data/';

// 1 week in miliseconds
const UPDATE_INTERVAL_MS = 604800000;
const _SEARCH_METRIC = 'a628c936-5d87-434a-a57a-015a0f223838';

/**
 * Class: AisleInteraction
 * AisleInteraction module.
 *
 * Manages magazine issues, displaying them in the <view>, and keeping track of
 * which ones have been read.
 */
const AisleInteraction = new Lang.Class({
    Name: 'AisleInteraction',
    GTypeName: 'EknAisleInteraction',
    Extends: GObject.Object,
    Implements: [ Module.Module, Launcher.Launcher, Interaction.Interaction ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'application': GObject.ParamSpec.override('application', Interaction.Interaction),
        'template-type': GObject.ParamSpec.override('template-type', Interaction.Interaction),
        'css': GObject.ParamSpec.override('css', Interaction.Interaction),
        /**
         * Property: settings
         * Handles the User Settings
         *
         * Handles the <AisleUserSettingsModel>, which controls things like the
         * last article read and last issue read.
         *
         * Flags:
         *   Construct only
         */
        'settings': GObject.ParamSpec.object('settings', 'User Settings',
            'Handles the User Settings',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: current-page
         *
         * The current article page number.
         *
         * If a standalone page is displaying, then this value is not relevant.
         * A value of 0 represents the overview page, and a value of one beyond
         * the last page represents the done page.
         *
         * Flags:
         *   Read only
         */
        'current-page': GObject.ParamSpec.uint('current-page', 'Current page',
            'Page number currently being displayed',
            GObject.ParamFlags.READABLE,
            0, GLib.MAXUINT32, 0),
        /**
         * Property: history-model
         *
         * The history model for this application.
         *
         * The history model keeps track of which pages have been visited
         * by the user.
         *
         * Flags:
         *   Read only
         */
        'history-model': GObject.ParamSpec.object('history-model', 'History model',
            'The history model for this application',
            GObject.ParamFlags.READABLE,
            GObject.Object.$gtype),
    },

    _NUM_ARTICLE_PAGE_STYLES: 3,

    _init: function (props) {
        this._launched_once = false;

        let css = Gio.File.new_for_uri(DATA_RESOURCE_PATH + 'css/endless_reader.css');
        Utils.add_css_provider_from_file(css, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        props.settings = props.settings || new AisleUserSettingsModel.AisleUserSettingsModel({
            settings_file: Gio.File.new_for_path(props.application.config_dir.get_path() + '/user_settings.json'),
        });

        this.parent(props);

        this._window = this.create_submodule('window', {
            application: this.application,
        });

        this._check_for_content_update();

        this._webview_map = {};
        this._article_models = [];

        this.history_model = new EosKnowledgePrivate.HistoryModel();
        this._history_presenter = new HistoryPresenter.HistoryPresenter({
            history_model: this.history_model,
        });

        this._style_knobs = StyleKnobGenerator.get_knobs_from_css(this.css, this.template_type);
        this.load_theme();

        this._pending_present_timestamp = null;

        this._webview_tooltip_presenter = new WebviewTooltipPresenter.WebviewTooltipPresenter();

        // Connect signals
        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.NAV_BACK_CLICKED:
                    this._add_history_item_for_page(this._current_page - 1);
                    break;
                case Actions.NAV_FORWARD_CLICKED:
                    let next_page = (this._current_page + 1) % this._window.total_pages;
                    this._add_history_item_for_page(next_page);
                    break;
                case Actions.SEARCH_CLICKED:
                    this._history_presenter.set_current_item_from_props({
                        page_type: this._ARTICLE_PAGE,
                        model: payload.model,
                    });
                    break;
                case Actions.NEED_MORE_SEARCH:
                    this._load_more_results(Actions.APPEND_SEARCH);
                    break;
                case Actions.NEED_MORE_SUGGESTED_ARTICLES:
                    this._load_more_suggestions(payload.query);
                    break;
                case Actions.SEARCH_TEXT_ENTERED:
                    this._on_search(payload.text);
                    break;
                case Actions.AUTOCOMPLETE_CLICKED:
                case Actions.ITEM_CLICKED:
                    this._history_presenter.set_current_item_from_props({
                        page_type: this._ARTICLE_PAGE,
                        model: payload.model,
                    });
                    break;
            }
        });

        this._window.issue_nav_buttons.back_button.connect('clicked', function () {
            this.settings.start_article = 0;
            this.settings.bookmark_page = 0;
        }.bind(this));
        this._window.issue_nav_buttons.forward_button.connect('clicked', function () {
            this._update_content();
        }.bind(this));
        this.settings.connect('notify::start-article',
            this._load_new_issue.bind(this));
        let handler = this._window.connect('debug-hotkey-pressed', function () {
            this._window.issue_nav_buttons.show();
            this._window.disconnect(handler);  // One-shot signal handler only.
        }.bind(this));

        this._window.standalone_page.infobar.connect('response', this._open_magazine.bind(this));
        this._history_presenter.connect('history-item-changed', this._on_history_item_change.bind(this));
        this._webview_tooltip_presenter.connect('show-tooltip', this._on_show_tooltip.bind(this));
    },

    get current_page() {
        return this._current_page;
    },

    _get_knob_css: function (css_data) {
        let str = '';
        for (let key in css_data) {
            let num = (key.match(/\d+/) || [])[0];
            if (/snippet[0-2]/.test(key)) {
                str += ArticleSnippetCard.get_css_for_module(css_data[key], num);
            } else if (/article_page[0-2]/.test(key)) {
                str += ReaderDocumentCard.get_css_for_module(css_data[key], num);
            } else if (/reader_card[0-2]/.test(key)) {
                str += ReaderCard.get_css_for_module(css_data[key], num);
            } else if (key === 'back_cover') {
                str += BackCover.get_css_for_module(css_data[key]);
            } else if (key === 'overview_page') {
                str += SidebarTemplate.get_css_for_module(css_data[key]);
            }
        }
        return str;
    },

    /*
     * FIXME: This function will change once we have finalized the structure
     * of the app.json. Load both the base library css styles and the theme specific
     * styles. Make sure to apply the theme styling second, so that
     * it gets priority.
     */
    load_theme: function () {
        let css_path = Gio.File.new_for_uri(DATA_RESOURCE_PATH).get_child('css');
        let css_files = [css_path.get_child('endless_reader.css')];
        // FIXME: Get theme from app.json once we have finalized that
        let theme = 'jungle';
        if (typeof theme !== 'undefined') {
            //css_files.push(css_path.get_child('themes').get_child(theme + '.css'));
        }
        let all_css = css_files.reduce((str, css_file) => {
            return str + css_file.load_contents(null)[1];
        }, '');
        all_css += this._get_knob_css(this._style_knobs);
        let provider = new Gtk.CssProvider();
        provider.load_from_data(all_css);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    },

    _ARTICLE_PAGE: 'article',
    _SEARCH_PAGE: 'search',
    _OVERVIEW_PAGE: 'overview',
    _BACK_COVER: 'done',

    // Launcher override
    search: function (timestamp, query) {
        this._pending_present_timestamp = timestamp;
        this._launch_type = Launcher.LaunchType.SEARCH;
        this._ensure_content_loaded(() => {
            this._on_search(query);
        });
    },

    _on_search: function (query) {
        let sanitized_query = Utils.sanitize_query(query);
        // Ignore empty queries
        if (sanitized_query.length === 0)
            return;
        this.record_search_metric(query);

        this._history_presenter.set_current_item_from_props({
            page_type: this._SEARCH_PAGE,
            query: sanitized_query,
        });
    },

    _add_history_item_for_page: function (page_index) {
        if (page_index === 0) {
            this._history_presenter.set_current_item_from_props({
                page_type: this._OVERVIEW_PAGE,
            });
        } else if (page_index === this._window.total_pages - 1) {
            this._history_presenter.set_current_item_from_props({
                page_type: this._BACK_COVER,
            });
        } else {
            this._history_presenter.set_current_item_from_props({
                page_type: this._ARTICLE_PAGE,
                model: this._article_models[page_index - 1],
            });
        }
    },

    _on_history_item_change: function (presenter, item) {
        let dispatcher = Dispatcher.get_default();
        dispatcher.dispatch({
            action_type: Actions.SET_SEARCH_TEXT,
            text: item.query,
        });
        dispatcher.dispatch({
            action_type: Actions.HIDE_MEDIA,
        });
        switch (item.page_type) {
            case this._SEARCH_PAGE:
                dispatcher.dispatch({
                    action_type: Actions.SEARCH_STARTED,
                    query: item.query,
                });
                this._window.show_search_page();
                let query_obj = new QueryObject.QueryObject({
                    query: item.query,
                    limit: RESULTS_SIZE,
                });

                Engine.get_default().get_objects_by_query(query_obj, null, (engine, task) => {
                    let results, get_more_results_query;
                    try {
                        [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
                    } catch (error) {
                        dispatcher.dispatch({
                            action_type: Actions.SEARCH_FAILED,
                            query: item.query,
                            error: new Error('Search failed for unknown reason'),
                        });
                        logError(error);
                        return;
                    }
                    // FIXME: This is an awful hack. We need our reader search
                    // cards to show the proper page number on hover, however we
                    // make the cards in the SearchModule and not here. We need
                    // to figure out a good way to create cards with UI
                    // depending on application state anywhere our module tree,
                    // but for now we just hack up the models page_number.
                    results.map((model) => {
                        model.page_number = this._get_page_number_for_article_model(model);
                    });
                    dispatcher.dispatch({
                        action_type: Actions.CLEAR_SEARCH,
                    });
                    dispatcher.dispatch({
                        action_type: Actions.APPEND_SEARCH,
                        models: results,
                    });
                    dispatcher.dispatch({
                        action_type: Actions.SEARCH_READY,
                        query: item.query,
                    });
                    this._present_if_needed();
                });
                break;
            case this._ARTICLE_PAGE:
                this._go_to_article(item.model, item.from_global_search);
                dispatcher.dispatch({
                    action_type: Actions.SHOW_ARTICLE,
                    model: item.model,
                });
                break;
            case this._OVERVIEW_PAGE:
                this._go_to_page(0);
                break;
            case this._BACK_COVER:
                this._go_to_page(this._article_models.length + 1);
                break;
            default:
                printerr("Unexpected page type " + item.page_type);
                this._go_to_page(0);
        }
    },

    _open_magazine: function () {
        this._add_history_item_for_page(0);
    },

    // Launcher override
    desktop_launch: function (timestamp=Gdk.CURRENT_TIME) {
        this._pending_present_timestamp = timestamp;
        this._launch_type = Launcher.LaunchType.DESKTOP;
        this._ensure_content_loaded(() => {
            this._add_history_item_for_page(this.settings.bookmark_page);
        });
    },

    // Launcher override
    activate_search_result: function (timestamp, id, query) {
        this._pending_present_timestamp = timestamp;
        this._launch_type = Launcher.LaunchType.SEARCH_RESULT;
        this._ensure_content_loaded(() => {
            Engine.get_default().get_object_by_id(id, null, (engine, task) => {
                let model;
                try {
                    model = engine.get_object_by_id_finish(task);
                    this._history_presenter.set_current_item_from_props({
                        page_type: this._ARTICLE_PAGE,
                        model: model,
                        query: query,
                        from_global_search: true,
                    });
                } catch (error) {
                    logError(error);
                    this._show_specific_error_page();
                    this._present_if_needed();
                }
            });
        });
    },

    // Should be mocked out during tests so that we don't actually send metrics
    record_search_metric: function (query) {
        let recorder = EosMetrics.EventRecorder.get_default();
        recorder.record_event(_SEARCH_METRIC, new GLib.Variant('(ss)',
            [query, this.application.application_id]));
    },

    _is_archived: function (model) {
        let already_read = model.article_number < this.settings.start_article;
        let not_read_yet = model.article_number >= this.settings.start_article + TOTAL_ARTICLES;
        return already_read || not_read_yet;
    },

    _clear_webview_from_map: function (index) {
        this._window.get_article_page(index).clear_content();
        delete this._webview_map[index];
    },

    // Clear out all existing content in preparation for loading a new issue.
    _clear_content: function () {
        // Make sure to drop all references to webviews we are holding.
        for (let article_index in this._webview_map) {
            this._clear_webview_from_map(article_index);
        }
        // Clear out state from any issue that was already displaying.
        this._article_models = [];
        this._window.remove_all_article_pages();
        Dispatcher.get_default().dispatch({
            action_type: Actions.CLEAR_ITEMS,
        });
    },

    _append_results: function (results) {
        this._total_fetched += RESULTS_SIZE;
        this._create_pages_from_models(results);
    },

    _load_new_issue: function () {
        // Load all articles in this issue
        this._clear_content();
        this._ensure_content_loaded((error) => {
            if (!error)
                this._add_history_item_for_page(0);
        });
    },

    _check_for_content_update: function() {
        let now = new Date();
        let last_update = new Date(this.settings.update_timestamp);
        if (now - last_update >= UPDATE_INTERVAL_MS) {
            this._update_content();
        }
    },

    _load_more_results: function (action_type) {
        if (!this._get_more_results_query)
            return;
        Engine.get_default().get_objects_by_query(this._get_more_results_query,
                                                  null,
                                                  (engine, task) => {
            let results, get_more_results_query;
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                logError(error);
                return;
            }

            if (results.length > 0) {
                let dispatcher = Dispatcher.get_default();
                dispatcher.dispatch({
                    action_type: action_type,
                    models: results,
                });
            }
            this._get_more_results_query = get_more_results_query;
        });
    },

    _load_more_suggestions: function (query) {
        let hash = Utils.dumb_hash(query);
        let random_query = new QueryObject.QueryObject({
            offset: hash % TOTAL_ARTICLES,
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
                models: Utils.shuffle(random_results, rand_sequence).slice(0, 6),
            });
        });
    },

    _update_content: function () {
        this.settings.update_timestamp = new Date().toISOString();
        this.settings.start_article = this.settings.highest_article_read;
        this.settings.bookmark_page = 0;
    },

    _present_if_needed: function () {
        if (this._pending_present_timestamp !== null) {
            if (!this._launched_once) {
                Dispatcher.get_default().dispatch({
                    action_type: Actions.FIRST_LAUNCH,
                    timestamp: this._pending_present_timestamp,
                    launch_type: this._launch_type,
                });
                this._launched_once = true;
            }
            this._pending_present_timestamp = null;
        }
    },

    _ensure_content_loaded: function (callback) {
        if (this._article_models.length > 0) {
            callback();
            return;
        }

        this._total_fetched = 0;
        let query_obj = new QueryObject.QueryObject({
            offset: this.settings.start_article,
            limit: RESULTS_SIZE,
            sort: QueryObject.QueryObjectSort.ARTICLE_NUMBER,
            tags: ['EknArticleObject'],
        });
        Engine.get_default().get_objects_by_query(query_obj,
                                                  null,
                                                  (engine, task) => {
            let results, get_more_results_query;
            let error;
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (e) {
                error = e;
            }

            if (!error && results.length < 1 && this.settings.start_article === 0) {
                error = GLib.Error.new_literal(Gio.io_error_quark(),
                    Gio.IOErrorEnum.NOT_FOUND,
                    'No content found for this magazine');
            }

            if (error) {
                logError(error);
                this._show_general_error_page();
                this._present_if_needed();
            } else if (results.length < 1) {
                // We have exhausted all articles in this magazine.
                // Reset counter and start from beginning!
                this.settings.start_article = 0;
                this.settings.bookmark_page = 0;
            } else {
                this._fetch_content_recursive(results, get_more_results_query, callback, this._append_results.bind(this));
            }
        });
    },

    _fetch_content_recursive: function (results, get_more_results_query, callback, progress_callback) {
        progress_callback(results);
        if (results.length < RESULTS_SIZE || this._total_fetched >= TOTAL_ARTICLES) {
            // We now have all the articles we want to show. Now we load the
            // HTML content for the first few pages into the webview.
            this._load_overview_snippets_from_articles();
            callback();
            return;
        }

        Engine.get_default().get_objects_by_query(get_more_results_query,
                                                  null,
                                                  (engine, task) => {
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                logError(error);
                this._show_general_error_page();
                this._present_if_needed();
            }

            this._fetch_content_recursive(results, get_more_results_query, callback, progress_callback);
        });
    },

    _go_to_article: function (model, from_global_search) {
        if (this._is_archived(model)) {
            this._load_standalone_article(model, from_global_search);
            if (from_global_search) {
                this._window.show_global_search_standalone_page();
            } else {
                this._window.show_in_app_standalone_page();
            }
        } else {
            let page_number = this._get_page_number_for_article_model(model);
            this._go_to_page(page_number);
        }
        this._present_if_needed();
    },

    // Takes user to the page specified by <index>
    // Note index is with respect to all pages in the app - that is, all article
    // pages + overview page + done page. So to go to the overview page, you
    // would call this._go_to_page(0)
    _go_to_page: function (index) {
        if (this._current_page === index && this._window.article_pages_visible())
            return;

        let animation_type;
        if (!this._window.article_pages_visible()) {
            animation_type = EosKnowledgePrivate.LoadingAnimationType.NONE;
        } else if (index === this._current_page - 1) {
            animation_type = EosKnowledgePrivate.LoadingAnimationType.BACKWARDS_NAVIGATION;
        } else if (index === this._current_page + 1) {
            animation_type = EosKnowledgePrivate.LoadingAnimationType.FORWARDS_NAVIGATION;
        } else if (index < this._current_page) {
            animation_type = EosKnowledgePrivate.LoadingAnimationType.MULTI_BACKWARDS_NAVIGATION;
        } else {
            animation_type = EosKnowledgePrivate.LoadingAnimationType.MULTI_FORWARDS_NAVIGATION;
        }

        let current_article = index - 1;
        if (index === 0)
            this._window.show_front_page(animation_type);
        else if (index === this._window.total_pages - 1)
            this._window.show_back_page(animation_type);
        else
            this._window.show_article_page(current_article, animation_type);

        // We want to always have ready on deck the webviews for the current
        // article, the article preceding the current one, and the next article.
        // These three webviews are stored in the webview_map. The key in the
        // map is the article number (not page number in the app) which those
        // pages correspond to. The values in the map are the EknWebview objects
        // for those articles. E.g. if you are on page 7, you'd have a
        // webview_map like:
        // {6: <webview_object>, 7: <webview_object>, 8: <webview_object>}

        // The range of article numbers for which we want to store webviews (the
        // current, the preceding, the next), excluding negative index values.
        let article_index_range = [
            current_article - 1,
            current_article,
            current_article + 1
        ].filter((index) => index in this._article_models);

        // Clear out any webviews in the map that we don't need anymore
        for (let article_index in this._webview_map) {
            if (article_index_range.indexOf(Number(article_index)) === -1)
                this._clear_webview_from_map(article_index);
        }

        // Add to the map any webviews we do now need.
        article_index_range.filter((index) => {
            return !(index in this._webview_map);
        }).forEach((index) => {
            let document_card = this._window.get_article_page(index);
            document_card.load_content(null, (card, task) => {
                try {
                    card.load_content_finish(task);
                } catch (error) {
                    logError(error);
                    this._show_specific_error_page();
                }
            });
            this._webview_tooltip_presenter.set_document_card(document_card);
            this._webview_map[index] = document_card;
        });

        this._current_page = index;
        this.notify('current-page');
        // Guaranteed to have changed; we returned early if not changed.

        this.settings.bookmark_page = index;
        this._present_if_needed();
    },

    // First article data has been loaded asynchronously; now we can start
    // loading its content, and show the window. Until this point the user will
    // have seen the loading splash screen. Also start loading the rest of the
    // pages, asynchronously.
    _create_pages_from_models: function (models) {
        models.forEach(function (model) {
            let page = this._create_article_page_from_article_model(model, new ProgressLabel.ProgressLabel());
            this._window.append_article_page(page);
        }, this);
        this._article_models = this._article_models.concat(models);
    },

    // Take an ArticleObjectModel and create a ReaderDocumentCard view.
    _create_article_page_from_article_model: function (model, info_notice) {
        let card_props = {
            model: model,
            info_notice: info_notice,
        };

        // FIXME: This should probably be a slot on a document page and not the
        // interaction model.
        let document_card = this.create_submodule('document-card', card_props);
        document_card.connect('ekn-link-clicked', (card, uri) => {
            let scheme = GLib.uri_parse_scheme(uri);
            if (scheme !== 'ekn')
                return;

            Engine.get_default().get_object_by_id(uri, null, (engine, task) => {
                let clicked_model;
                try {
                    clicked_model = engine.get_object_by_id_finish(task);
                } catch (error) {
                    logError(error, 'Could not open link from reader article');
                    return;
                }

                if (clicked_model instanceof MediaObjectModel.MediaObjectModel) {
                    Dispatcher.get_default().dispatch({
                        action_type: Actions.SHOW_MEDIA,
                        model: clicked_model,
                    });
                } else if (clicked_model instanceof ArticleObjectModel.ArticleObjectModel) {
                    this._history_presenter.set_current_item_from_props({
                        page_type: this._ARTICLE_PAGE,
                        model: clicked_model,
                    });
                }
            });
        });

        return document_card;
    },

    _get_page_number_for_article_model: function(model) {
        let filtered_indices = [];
        this._article_models.filter((article_model, index) => {
            if (article_model.article_number === model.article_number)
                filtered_indices.push(index);
            return (article_model.article_number === model.article_number);
        });

        if (filtered_indices.length === 0) {
            // Article model not found in this issue's article array!
            return -1;
        } else {
            // We expect to have one filtered element, hence we return that filtered index
            // We increment by one to account for cover page.
            return filtered_indices[0] + 1;
        }
    },

    // Show a friendlier error message when the engine is not working; suggest
    // restarting the computer because that's the only thing under the user's
    // control at this point that might get the knowledge engine back up. This is
    // in order to prevent the "Message Corrupt" effect.
    _create_error_label: function (headline, message) {
        let err_label = new Gtk.Label({
            label: '<span size="xx-large"><b>' + headline + '</b></span>\n' + message,
            justify: Gtk.Justification.CENTER,
            use_markup: true,
        });
        err_label.get_style_context().add_class(StyleClasses.READER_ERROR_PAGE);
        err_label.show();
        return err_label;
    },

    _show_error_page: function (headline, message) {
        let err_label = this._create_error_label(headline, message);
        this._window.page_manager.add(err_label);
        this._window.page_manager.visible_child = err_label;
    },

    // Use _create_error_label to show a general error page, when there is no
    // content.
    _show_general_error_page: function () {
        this._show_error_page(_("Oops!"),
            _("We could not find this magazine!\nPlease try again after restarting your computer."));
    },

    // Use _create_error_label to show a specific error page, when a particular
    // page couldn't be found.
    _show_specific_error_page: function () {
        this._show_error_page(_("Oops!"),
            _("There was an error loading that page.\nTry another one or try again after restarting your computer."));
    },

    _load_overview_snippets_from_articles: function () {
        let snippets = this._article_models.slice(0, NUM_OVERVIEW_SNIPPETS);
        let dispatcher = Dispatcher.get_default();
        dispatcher.dispatch({
            action_type: Actions.CLEAR_ITEMS,
        });
        dispatcher.dispatch({
            action_type: Actions.APPEND_ITEMS,
            models: snippets,
        });
    },

    _load_standalone_article: function (model, from_global_search) {
        let info_notice = null;
        if (!from_global_search) {
            info_notice = new Gtk.Frame();
            // Ensures that the archive notice on the in app standalone page
            // matches that of the standalone page you reach via global search
            info_notice.add(new ArchiveNotice.ArchiveNotice({
                label: this._window.standalone_page.infobar.archive_notice.label,
            }));
            info_notice.get_style_context().add_class(StyleClasses.READER_ARCHIVE_NOTICE_FRAME);
        }
        let document_card = this._create_article_page_from_article_model(model, info_notice);
        document_card.load_content(null, (card, task) => {
            try {
                card.load_content_finish(task);
            } catch (error) {
                logError(error);
                this._show_error_page();
            }
        });
        this._window.standalone_page.document_card = document_card;
    },

    _on_article_card_clicked: function (model) {
        this._history_presenter.set_current_item_from_props({
            page_type: this._ARTICLE_PAGE,
            model: model,
        });
    },

    _on_show_tooltip: function (tooltip_presenter, tooltip, uri) {
        let filtered_indices = [];
        let filtered_models = this._article_models.filter((model, index) => {
            if (model.ekn_id === uri)
                filtered_indices.push(index);
            return (model.ekn_id === uri);
        });

        // If a model is filtered by the uri, it means it's an in-issue article.
        if (filtered_models.length > 0) {
            // We expect to have one article model that matches the given uri,
            // hence we obtain the first filtered model and first matched index.
            // Note: The page number argument is incremented by two, to account
            // for the 0-base index and the overview page.

            /* TRANSLATORS: This shows the page number; %d will be replaced with
            the page number of the article. */
            let page_number_string = _("Page %d").format(filtered_indices[0] + 2).toLocaleUpperCase();
            this._webview_tooltip_presenter.show_page_label_tooltip(tooltip,
                filtered_models[0].title, page_number_string);
        } else if (GLib.uri_parse_scheme(uri) === 'ekn') {
            // If there is no filtered model but the uri has the "ekn://" prefix,
            // it's an archive article.
            Engine.get_default().get_object_by_id(uri, null, (engine, task) => {
                let article_model;
                try {
                    article_model = engine.get_object_by_id_finish(task);
                } catch (error) {
                    logError(error, 'Could not get article model');
                    return;
                }
                this._webview_tooltip_presenter.show_archive_tooltip(tooltip, article_model.title);
            });
        } else if (GLib.uri_parse_scheme(uri) === 'file' && uri.indexOf('/licenses/') > -1) {
            // If the uri has the "file://" scheme and it includes a segments for "licenses",
            // it corresponds to a license file, and we should display it as an external link.
            this._webview_tooltip_presenter.show_license_tooltip(tooltip);
        } else {
            this._webview_tooltip_presenter.show_external_link_tooltip(tooltip, uri);
        }
        return Gdk.EVENT_STOP;
    },

    get_slot_names: function () {
        return ['window', 'document-card'];
    },
});
