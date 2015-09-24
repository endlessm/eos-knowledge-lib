const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const EosMetrics = imports.gi.EosMetrics;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ArticleHTMLRenderer = imports.app.articleHTMLRenderer;
const Actions = imports.app.actions;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const HistoryItem = imports.app.historyItem;
const HistoryPresenter = imports.app.historyPresenter;
const Launcher = imports.app.launcher;
const MediaObjectModel = imports.search.mediaObjectModel;
const MeshInteraction = imports.app.modules.meshInteraction;
const QueryObject = imports.search.queryObject;
const StyleKnobGenerator = imports.app.compat.styleKnobGenerator;
const TabButton = imports.app.widgets.tabButton;
const TextCard = imports.app.modules.textCard;
const Utils = imports.app.utils;
const WebkitContextSetup = imports.app.webkitContextSetup;

const HOME_PAGE_A_MAX_CARDS = 6;
const RESULTS_SIZE = 10;
const _SEARCH_METRIC = 'a628c936-5d87-434a-a57a-015a0f223838';
const DATA_RESOURCE_PATH = 'resource:///com/endlessm/knowledge/';

/**
 * Class: Presenter
 *
 * A presenter module to manage this application. It initializes an application
 * from a JSON file. It will set up the <Card> widgets on the home page
 * and connect to signal events on those card widgets
 *
 * It has one property, which is the window, representing the top level view
 * of the application.
 *
 */
const Presenter = new Lang.Class({
    Name: 'Presenter',
    GTypeName: 'EknPresenter',
    Extends: MeshInteraction.MeshInteraction,
    Implements: [ Launcher.Launcher ],

    _ARTICLE_PAGE: 'article',
    _HOME_PAGE: 'home',
    _SEARCH_PAGE: 'search',
    _SECTION_PAGE: 'section',

    Properties: {
        /**
         * Property: application
         * The GApplication for the knowledge app
         *
         * This should always be set except for during testing. If this is not
         * set in unit testing, make sure to mock out view object. The real
         * Endless.Window requires a application on construction.
         *
         * Flags:
         *   Construct only
         */
        'application': GObject.ParamSpec.object('application', 'Application',
            'Presenter for article page',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: factory
         * Factory to create modules
         */
        'factory': GObject.ParamSpec.object('factory', 'Factory', 'Factory',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: engine
         * Handle to EOS knowledge engine
         *
         * Pass an instance of <Engine> to this property.
         * This is a property for purposes of dependency injection during
         * testing.
         *
         * Flags:
         *   Construct only
         */
        'engine': GObject.ParamSpec.object('engine', 'Engine',
            'Handle to EOS knowledge engine',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: view
         * Knowledge app view
         *
         * Pass an instance of <Window> to this property.
         * This is a property for purposes of dependency injection during
         * testing.
         *
         * Flags:
         *   Construct only
         */
        'view': GObject.ParamSpec.object('view', 'View',
            'Knowledge app view',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: template-type
         * FIXME: This is a temporary step towards the development of interactions.
         *   Scheduled for destruction.
         */
        'template-type': GObject.ParamSpec.string('template-type', 'template-type',
            'Template type of the Knowledge app',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: css
         * FIXME: This is a temporary step towards the development of interactions.
         *   Scheduled for destruction.
         */
        'css': GObject.ParamSpec.string('css', 'css',
            'Template type of the Knowledge app',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    },

    _init: function (props) {
        // Needs to happen before before any webviews are created
        WebkitContextSetup.register_webkit_extensions(props.application.application_id);
        WebkitContextSetup.register_webkit_uri_handlers(this._article_render_callback.bind(this));

        props.view = props.view || props.factory.create_named_module('window', {
            application: props.application,
            template_type: props.template_type,
        });
        props.engine = props.engine || Engine.Engine.get_default();
        this.parent(props);

        let dispatcher = Dispatcher.get_default();
        this._style_knobs = StyleKnobGenerator.get_knobs_from_css(this.css, this.template_type);
        this.load_theme();

        let query = new QueryObject.QueryObject({
            limit: 100,  // FIXME arbitrary, can we say "no limit"?
            tags: [ Engine.HOME_PAGE_TAG ],
        });
        this.engine.get_objects_by_query(query, null, (engine, res) => {
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

        this._renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer();

        this._history_presenter = new HistoryPresenter.HistoryPresenter({
            history_model: new EosKnowledgePrivate.HistoryModel(),
        });
        this._history_presenter.set_current_item_from_props({
            page_type: this._HOME_PAGE,
        });

        // Connect signals
        this.view.connect('search-focused', this._on_search_focus.bind(this));

        dispatcher.register((payload) => {
            switch(payload.action_type) {
                case Actions.NAV_BACK_CLICKED:
                    this._on_back();
                    break;
                case Actions.SET_CLICKED:
                    this._history_presenter.set_current_item_from_props({
                        page_type: this._SECTION_PAGE,
                        model: payload.model,
                    });
                    break;
                case Actions.ITEM_CLICKED:
                case Actions.SEARCH_CLICKED:
                    this._history_presenter.set_current_item_from_props({
                        page_type: this._ARTICLE_PAGE,
                        model: payload.model,
                    });
                    break;
                case Actions.NEED_MORE_ITEMS:
                    this._load_more_results(Actions.APPEND_ITEMS);
                    break;
                case Actions.NEED_MORE_SEARCH:
                    this._load_more_results(Actions.APPEND_SEARCH);
                    break;
                case Actions.SEARCH_TEXT_ENTERED:
                    this._on_search_text_entered(payload.text);
                    break;
                case Actions.AUTOCOMPLETE_CLICKED:
                    this._history_presenter.set_current_item_from_props({
                        page_type: this._ARTICLE_PAGE,
                        model: payload.model,
                        query: payload.text,
                    });
                    break;
                case Actions.ARTICLE_LINK_CLICKED:
                    this._on_link_clicked(payload.ekn_id);
                    break;
            }
        });

        dispatcher.dispatch({
            action_type: Actions.FOCUS_SEARCH,
        });

        this._history_presenter.connect('history-item-changed', this._on_history_item_change.bind(this));

        this._current_article_results_item = null;
    },

    STYLE_MAP: {
        A: {
            section_card: '.card-a',
            article_card: '.article-card',
            section_page: '.section-page-a',
            search_page: '.search-page-a',
        },
        B: {
            section_card: '.card-b',
            article_card: '.text-card',
            section_page: '.section-page-b',
            search_page: '.search-page-b',
        },
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

    /*
     * FIXME: This function will change once we have finalized the structure
     * of the app.json. Load both the base library css styles and the theme specific
     * styles. Make sure to apply the theme styling second, so that
     * it gets priority.
     */
    load_theme: function () {
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
        let provider = new Gtk.CssProvider();
        provider.load_from_data(all_css);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    },

    // Launcher override
    desktop_launch: function (timestamp) {
        this.view.present_with_time(timestamp);
    },

    // Should be mocked out during tests so that we don't actually send metrics
    record_search_metric: function (query) {
        let recorder = EosMetrics.EventRecorder.get_default();
        recorder.record_event(_SEARCH_METRIC, new GLib.Variant('(ss)',
            [query, this.application.application_id]));
    },

    _load_more_results: function (action_type) {
        if (!this._get_more_results_query)
            return;
        this.engine.get_objects_by_query(this._get_more_results_query,
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
                let item = this._history_presenter.history_model.current_item;
                if (item.page_type === this._ARTICLE_PAGE) {
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

    _on_history_item_change: function (presenter, item, is_going_back) {
        let dispatcher = Dispatcher.get_default();
        Dispatcher.get_default().dispatch({
            action_type: Actions.HIDE_MEDIA,
        });
        dispatcher.dispatch({
            action_type: Actions.CLEAR_HIGHLIGHTED_ITEM,
            model: item.model,
        });
        let search_text = '';
        switch (item.page_type) {
            case this._SEARCH_PAGE:
                dispatcher.dispatch({
                    action_type: Actions.SEARCH_STARTED,
                    query: item.query,
                });
                this.view.show_page(this.view.search_page);
                this._refresh_article_results((success) => {
                    if (!success) {
                        dispatcher.dispatch({
                            action_type: Actions.SEARCH_FAILED,
                            query: item.query,
                            error: new Error('Search failed for unknown reason'),
                        });
                        this.view.show_page(this.view.search_page);
                        return;
                    }
                    dispatcher.dispatch({
                        action_type: Actions.SEARCH_READY,
                        query: item.query,
                    });
                });
                search_text = item.query;
                break;
            case this._SECTION_PAGE:
                dispatcher.dispatch({
                    action_type: Actions.SHOW_SET,
                    model: item.model,
                });
                this._refresh_article_results(() => {
                    dispatcher.dispatch({
                        action_type: Actions.SET_READY,
                        model: item.model,
                    });
                    this.view.show_page(this.view.section_page);
                });
                break;
            case this._ARTICLE_PAGE:
                if (this.template_type === 'B') {
                    this._refresh_article_results(() => {
                        dispatcher.dispatch({
                            action_type: Actions.HIGHLIGHT_ITEM,
                            model: item.model,
                        });
                    });
                    let query_item = this._history_presenter.search_backwards(0, (query_item) => {
                        return query_item.page_type === this._SECTION_PAGE || query_item.query;
                    });
                    search_text = query_item.query;
                }
                this._load_document_card_in_view(item, is_going_back);
                break;
            case this._HOME_PAGE:
                this.view.show_page(this.view.home_page);
        }
        dispatcher.dispatch({
            action_type: Actions.SET_SEARCH_TEXT,
            text: search_text,
        });
    },

    _load_document_card_in_view: function (item, is_going_back) {
        let animation_type = EosKnowledgePrivate.LoadingAnimationType.FORWARDS_NAVIGATION;
        if (this.view.get_visible_page() !== this.view.article_page) {
            animation_type = EosKnowledgePrivate.LoadingAnimationType.NONE;
            this.view.show_page(this.view.article_page);
        } else if (is_going_back) {
            animation_type = EosKnowledgePrivate.LoadingAnimationType.BACKWARDS_NAVIGATION;
        }
        Dispatcher.get_default().dispatch({
            action_type: Actions.SHOW_ARTICLE,
            model: item.model,
            animation_type: animation_type,
        });
    },

    _on_link_clicked: function (ekn_id) {
        this.engine.get_object_by_id(ekn_id, null, (engine, task) => {
            let model;
            try {
                model = engine.get_object_by_id_finish(task);
            } catch (error) {
                logError(error);
                return;
            }

            if (model instanceof MediaObjectModel.MediaObjectModel) {
                Dispatcher.get_default().dispatch({
                    action_type: Actions.SHOW_MEDIA,
                    model: model,
                });
            } else {
                this._history_presenter.set_current_item_from_props({
                    page_type: this._ARTICLE_PAGE,
                    model: model,
                });
            }
        });
    },

    _on_home_button_clicked: function (button) {
        this._history_presenter.set_current_item_from_props({
            page_type: this._HOME_PAGE,
        });
    },

    // Launcher override
    search: function (timestamp, query) {
        this._on_search_text_entered(query);
        this.view.present_with_time(timestamp);
    },

    _on_search_focus: function (view, focused) {
        // If the user focused the search box, ensure that the lightbox is hidden
        Dispatcher.get_default().dispatch({
            action_type: Actions.HIDE_MEDIA,
        });
    },

    _on_search_text_entered: function (text) {
        let query = Utils.sanitize_query(text);
        // Ignore empty queries
        if (query.length === 0)
            return;
        this.record_search_metric(text);
        this._history_presenter.set_current_item_from_props({
            page_type: this._SEARCH_PAGE,
            query: query,
        });
    },

    // Launcher override
    activate_search_result: function (timestamp, ekn_id, query) {
        this.engine.get_object_by_id(ekn_id, null, (engine, task) => {
            try {
                let model = engine.get_object_by_id_finish(task);
                this._history_presenter.set_current_item_from_props({
                    page_type: this._ARTICLE_PAGE,
                    model: model,
                    query: query,
                });
            } catch (error) {
                logError(error);
            }
        });
        this.view.present_with_time(timestamp);
    },

    _on_back: function () {
        let types = this.view.get_visible_page() === this.view.article_page ?
            [this._HOME_PAGE, this._SECTION_PAGE, this._SEARCH_PAGE] : [this._HOME_PAGE];
        let item = this._history_presenter.search_backwards(-1,
            (item) => types.indexOf(item.page_type) >= 0);
        this._history_presenter.set_current_item(HistoryItem.HistoryItem.new_from_object(item));
    },

    // callback is called with a boolean argument; true if the search was
    // successful (even if no results), false if there was an error
    _refresh_article_results: function (callback) {
        let query_obj;
        let item = this._history_presenter.search_backwards(0, (item) => {
            if (item.page_type === this._SECTION_PAGE) {
                let tags = item.model.tags.slice();
                let home_page_tag_index = tags.indexOf(Engine.HOME_PAGE_TAG);
                if (home_page_tag_index !== -1)
                    tags.splice(home_page_tag_index, 1);

                query_obj = new QueryObject.QueryObject({
                    tags: tags,
                    limit: RESULTS_SIZE,
                });
                return true;
            } else if (item.query) {
                query_obj = new QueryObject.QueryObject({
                    query: item.query,
                    limit: RESULTS_SIZE,
                });
                return true;
            }
            return false;
        });
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
            if (item.page_type === this._SEARCH_PAGE) {
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

    _article_render_callback: function (article_model) {
        return this._renderer.render(article_model, {
            enable_scroll_manager: this.template_type === 'A',
            show_title: this.template_type !== 'A',
        });
    },
});
