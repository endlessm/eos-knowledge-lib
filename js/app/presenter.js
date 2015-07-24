const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const EosMetrics = imports.gi.EosMetrics;
const Format = imports.format;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ArticlePresenter = imports.app.articlePresenter;
const CardContainer = imports.app.modules.cardContainer;
const Config = imports.app.config;
const Engine = imports.search.engine;
const HistoryPresenter = imports.app.historyPresenter;
const Launcher = imports.app.launcher;
const LightboxPresenter = imports.app.lightboxPresenter;
const MediaObjectModel = imports.search.mediaObjectModel;
const QueryObject = imports.search.queryObject;
const TabButton = imports.app.tabButton;
const TextCard = imports.app.modules.textCard;
const Utils = imports.app.utils;
const WebkitContextSetup = imports.app.webkitContextSetup;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

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
    Extends: GObject.Object,
    Implements: [ Launcher.Launcher ],

    _ARTICLE_PAGE: 'article',
    _HOME_PAGE: 'home',
    _SEARCH_PAGE: 'search',
    _SECTION_PAGE: 'section',
    _CATEGORIES_PAGE: 'categories',

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
         * Property: article-presenter
         * Presenter for article page
         *
         * Pass an instance of <ArticlePresenter> to this property.
         * This is a property for purposes of dependency injection during
         * testing.
         *
         * Flags:
         *   Construct only
         */
        'article-presenter': GObject.ParamSpec.object('article-presenter', 'Article Presenter',
            'Presenter for article page',
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
    },

    _init: function (app_json, props) {
        this._template_type = app_json['templateType'];

        // Needs to happen before before any webviews are created
        WebkitContextSetup.register_webkit_extensions(props.application.application_id);

        props.view = props.view || props.factory.create_named_module('window', {
            application: props.application,
            template_type: this._template_type,
        });
        props.engine = props.engine || Engine.Engine.get_default();
        props.article_presenter = props.article_presenter || new ArticlePresenter.ArticlePresenter({
                article_view: props.view.article_page,
                template_type: this._template_type,
                factory: props.factory,
        });
        this.parent(props);

        this._style_knobs = app_json['styles'];
        this.load_theme();

        let query = new QueryObject.QueryObject({
            limit: 100,  // FIXME arbitrary, can we say "no limit"?
            tags: [ Engine.HOME_PAGE_TAG ],
        });
        this.engine.get_objects_by_query(query, null, (engine, res) => {
            let [sections, get_more] = engine.get_objects_by_query_finish(res);
            this._set_sections(sections);
        });

        this._lightbox_presenter = new LightboxPresenter.LightboxPresenter({
            engine: this.engine,
            view: this.view,
            factory: this.factory,
        });

        // Keeps track of the broad query that led to an individual article.
        this._latest_section_model = null;
        this._latest_origin_query_obj = new QueryObject.QueryObject();
        this._latest_article_card_title = '';
        this._latest_search_text = '';
        this._history_presenter = new HistoryPresenter.HistoryPresenter({
            history_model: new EosKnowledgePrivate.HistoryModel(),
            history_buttons: this.view.history_buttons,
        });
        this._add_history_object_for_home_page();

        // Connect signals
        this.view.connect('back-clicked', this._on_topbar_back_clicked.bind(this));
        this.view.connect('forward-clicked', this._on_topbar_forward_clicked.bind(this));
        this.view.connect('search-focused', this._on_search_focus.bind(this));
        this.view.connect('search-text-changed', this._on_search_text_changed.bind(this));
        this.view.connect('search-entered', function (view, query) {
            this._update_ui_and_search(query);
        }.bind(this));
        this.view.connect('article-selected', this._on_article_selection.bind(this));

        this.view.connect('sidebar-back-clicked', this._on_back.bind(this));

        this.view.home_page.connect('search-entered', function (view, query) {
            this._update_ui_and_search(query);
        }.bind(this));
        this.view.home_page.connect('search-text-changed', this._on_search_text_changed.bind(this));
        this.view.home_page.connect('article-selected', this._on_article_selection.bind(this));

        this.view.section_page.connect('load-more-results', this._on_load_more_results.bind(this));

        this.view.home_page.connect('show-categories', this._on_categories_button_clicked.bind(this));
        this.article_presenter.connect('ekn-link-clicked', this._on_ekn_link_clicked.bind(this));
        this.view.categories_page.connect('show-home', this._on_home_button_clicked.bind(this));
        this._original_page = this.view.home_page;
        this._search_origin_page = this.view.home_page;
        this._autocomplete_results = [];
    },

    STYLE_MAP: {
        A: {
            section_card: '.card-a',
            article_card: '.article-card',
            section_page: '.section-page-a',
            no_search_results_page: '.no-search-results-page-a'
        },
        B: {
            section_card: '.card-b',
            article_card: '.text-card',
            section_page: '.section-page-b',
            no_search_results_page: '.no-search-results-page-b'
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
            if (key === 'article_card' && this._template_type === 'B') {
                str += TextCard.get_css_for_module(module_styles);
            } else if (key === 'tab_button' && this._template_type === 'A') {
                str += TabButton.get_css_for_module(module_styles);
            } else {
                // All other modules can just convert their knobs to CSS strings
                // directly using the STYLE_MAP
                str += Utils.object_to_css_string(title_data, this.STYLE_MAP[this._template_type][key] + ' .title') + '\n';
                str += Utils.object_to_css_string(module_data, this.STYLE_MAP[this._template_type][key]) + '\n';
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
        let theme = this._template_type === 'A' ? 'templateA' : undefined;
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

    _on_load_more_results: function () {
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

            let cards = results.map(this._new_card_from_article_model.bind(this));
            if (cards.length > 0) {
                if (this._template_type === 'B') {
                    this.view.section_page.append_cards(cards);
                } else {
                    let article_segment_title = _("Articles");
                    this.view.section_page.append_to_segment(article_segment_title, cards);
                }
            }
            this._get_more_results_query = get_more_results_query;
        });
        // Null the query we just sent to the engine, when results come back
        // we'll have a new more results query. But this keeps us from double
        // loading this query.
        this._get_more_results_query = null;
    },

    _on_topbar_back_clicked: function () {
        this._lightbox_presenter.hide_lightbox();
        this._history_presenter.go_back();
        this._replicate_history_state(EosKnowledgePrivate.LoadingAnimationType.BACKWARDS_NAVIGATION);
    },

    _on_topbar_forward_clicked: function () {
        this._lightbox_presenter.hide_lightbox();
        this._history_presenter.go_forward();
        this._replicate_history_state(EosKnowledgePrivate.LoadingAnimationType.FORWARDS_NAVIGATION);
    },

    _replicate_history_state: function (animation_type) {
        let current_item = this._history_presenter.history_model.current_item;
        let article_origin_query_obj = current_item.article_origin_query_obj;
        switch (current_item.page_type) {
            case this._SEARCH_PAGE:
                this._perform_search(this.view, current_item.query_obj);
                break;
            case this._SECTION_PAGE:
                this.engine.get_objects_by_query(article_origin_query_obj, null,
                    this._load_section_page.bind(this, current_item.model));
                break;
            case this._ARTICLE_PAGE:
                if (article_origin_query_obj.query !== this._latest_origin_query_obj.query) {
                    this.engine.get_objects_by_query(article_origin_query_obj,
                                                     null,
                                                     this._refresh_sidebar_callback.bind(this));
                }
                this.article_presenter.load_article(current_item.model, animation_type);
                // For Template B, we reset the highlight to the card with the same title
                if (this._template_type === 'B')
                    this.view.section_page.highlight_card_with_name(
                        current_item.title,
                        current_item.article_origin_page
                    );
                this.view.show_article_page();
                break;
            case this._CATEGORIES_PAGE:
                this.view.show_categories_page();
                break;
            default:
                this.view.show_home_page();
        }

        // Update latest origin query.
        this._latest_origin_query_obj = current_item.article_origin_query_obj;
    },

    _refresh_sidebar_callback: function (engine, task) {
        let results;
        let get_more_results_query;
        try {
            [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
        } catch (error) {
            logError(error);
            return;
        }

        this._set_section_page_content(results);
        this._get_more_results_query = get_more_results_query;
    },

    _set_sections: function(sections) {
        let new_card_from_section = (section) => {
            let card = this.factory.create_named_module('home-card', {
                model: section,
            });
            card.connect('clicked', this._on_section_card_clicked.bind(this));
            return card;
        };

        if (this._template_type === 'A') {
            for (let page of [this.view.home_page, this.view.categories_page]) {
                let category_cards = sections.map(new_card_from_section);
                page.cards = category_cards;
            }
        } else {
            // FIXME: Temporarily handles passing of cards until we have dispatcher/alternative method.
            let card_container = this.view.home_page.get_submodule(CardContainer.CardContainer);
            card_container.cards = sections.map(new_card_from_section);
        }
    },

    _on_categories_button_clicked: function (button) {
        this._original_page = this.view.categories_page;
        this._add_history_object_for_categories_page();
        this.view.show_categories_page();
    },

    _on_home_button_clicked: function (button) {
        this._original_page = this.view.home_page;
        this._add_history_object_for_home_page();
        this.view.show_home_page();
    },

    _on_section_card_clicked: function (card) {
        this.view.lock_ui();

        let tags = card.model.tags.slice();
        let home_page_tag_index = tags.indexOf(Engine.HOME_PAGE_TAG);
        if (home_page_tag_index !== -1)
            tags.splice(home_page_tag_index, 1);

        let query_obj = new QueryObject.QueryObject({
            'tags': tags,
            'limit': RESULTS_SIZE,
        });
        this._add_history_object_for_section_page(card.model, query_obj);
        this.engine.get_objects_by_query(query_obj, null,
            this._load_section_page.bind(this, card.model));
    },

    // Launcher override
    search: function (timestamp, query) {
        this._update_ui_and_search(query);
        this.view.present_with_time(timestamp);
    },

    _update_ui_and_search: function (query) {
        query = Utils.sanitize_query(query);

        // Ignore empty queries
        if (query.length === 0) {
            return;
        }

        this.record_search_metric(query);

        let query_obj = new QueryObject.QueryObject({
            query: query,
            limit: RESULTS_SIZE,
        });

        this.view.search_box.text = query;
        this._add_history_object_for_search_page(query_obj);
        this._perform_search(this.view, query_obj);
    },

    _perform_search: function (view, query_obj) {
        this.view.lock_ui();

        // We clear the search box in the home page after each search.
        // The topbar search box should also clear once an article has been chosen.
        this.view.home_page.search_box.text = '';

        this.engine.get_objects_by_query(query_obj, null,
            this._load_query_page.bind(this, query_obj));
    },

    _on_search_focus: function (view, focused) {
        // If the user focused the search box, ensure that the lightbox is hidden
        this._lightbox_presenter.hide_lightbox();
    },

    /*
     * Returns either the title or origin_title of the obj, depending on which one
     * is closer to having query as a prefix. Doesn't use a simple indexOf, because
     * of the fact that query might not be accented, even when titles are.
     */
    _get_prefixed_title: function (obj, query) {
        let title = obj.title.toLowerCase();
        let original_title = obj.original_title.toLowerCase();
        query = query.toLowerCase();

        for (let i = 0; i < query.length; i++) {
            if (title[i] !== original_title[i]) {
                if (title[i] === query[i]) {
                    return obj.title;
                } else if (original_title[i] === query[i]) {
                    return obj.original_title;
                }
            }
        }

        return obj.title;
    },

    _on_search_text_changed: function (view, entry) {
        let query = Utils.sanitize_query(entry.text);
        this._latest_search_text = query;
        // Ignore empty queries
        if (query.length === 0) {
            return;
        }

        let query_obj = new QueryObject.QueryObject({
            query: query,
            limit: RESULTS_SIZE,
        });
        this._latest_origin_query_obj = query_obj;
        this.engine.get_objects_by_query(query_obj,
                                         null,
                                         (engine, task) => {
            let results;
            let get_more_results_query;
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                logError(error);
                return;
            }

            entry.set_menu_items(results.map((obj) => {
                return {
                    title: this._get_prefixed_title(obj, query),
                    id: obj.ekn_id,
                };
            }));
            this._autocomplete_results = results;
            this._get_more_results_from_search_query = get_more_results_query;
        });
    },

    _on_article_selection: function (view, id) {
        if (view === this.view.home_page) {
            this._search_origin_page = this.view.home_page;
        } else {
            this._search_origin_page = this.view.section_page;
        }
        this._get_more_results_query = this._get_more_results_from_search_query;

        // If template B, we need to set the autocomplete results as the cards on the
        // section page
        if (this._template_type === 'B') {
            let cards = this._autocomplete_results.map(this._new_card_from_article_model.bind(this));
            this.view.section_page.cards = cards;
        }

        let selected_model = this._autocomplete_results.filter(function (element) {
            return element.ekn_id === id;
        }, id)[0];
        this._add_history_object_for_article_page(selected_model);
        this.article_presenter.load_article(selected_model, EosKnowledgePrivate.LoadingAnimationType.NONE, function () {
            this.view.show_article_page();
        }.bind(this));
    },

    // Launcher override
    activate_search_result: function (timestamp, ekn_id, query) {
        let query_obj = new QueryObject.QueryObject({
            query: query,
            limit: RESULTS_SIZE,
        });
        this.engine.get_objects_by_query(query_obj,
                                         null,
                                         this._refresh_sidebar_callback.bind(this));
        this._latest_origin_query_obj = query_obj;

        this.engine.get_object_by_id(ekn_id, null, (engine, task) => {
            try {
                let model = engine.get_object_by_id_finish(task);
                this._add_history_object_for_article_page(model);
                this.article_presenter.load_article(model, EosKnowledgePrivate.LoadingAnimationType.NONE,
                                                    () => {
                                                        this.view.search_box.text = query;
                                                        this.view.show_article_page();
                                                    });
            } catch (error) {
                logError(error);
            }
        });
        this.view.present_with_time(timestamp);
    },

    _on_article_card_clicked: function (card, model) {
        let animation_type = this.view.get_visible_page() !== this.view.article_page ? EosKnowledgePrivate.LoadingAnimationType.NONE : EosKnowledgePrivate.LoadingAnimationType.FORWARDS_NAVIGATION;

        // Grab the title of the latest article card clicked.
        // All subsequent navigations from this article page need to add a visual cue to this card.
        this._latest_article_card_title = model.title;

        this._add_history_object_for_article_page(model);
        this.article_presenter.load_article(model, animation_type, function () {
            this.view.show_article_page();
        }.bind(this));
        if (this._template_type === 'B')
            this.view.section_page.highlight_card(card);
    },

    _add_history_object_for_article_page: function (model) {
        this._history_presenter.set_current_item({
            title: model.title,
            page_type: this._ARTICLE_PAGE,
            model: model,
            article_origin_query_obj: this._latest_origin_query_obj,
            article_origin_page: this._latest_article_card_title,
        });
    },

    _add_history_object_for_search_page: function (query_obj) {
        this._latest_origin_query_obj = query_obj;
        this._history_presenter.set_current_item({
            title: Utils.page_title_from_query_object(query_obj),
            page_type: this._SEARCH_PAGE,
            query_obj: query_obj,
            article_origin_query_obj: this._latest_origin_query_obj,
        });
    },

    _add_history_object_for_section_page: function (model, query_obj) {
        this._latest_origin_query_obj = query_obj;
        this._history_presenter.set_current_item({
            title: model.title,
            page_type: this._SECTION_PAGE,
            model: model,
            query_obj: query_obj,
            article_origin_query_obj: this._latest_origin_query_obj,
        });
    },

    _add_history_object_for_home_page: function () {
        this._history_presenter.set_current_item({
            page_type: this._HOME_PAGE,
            article_origin_query_obj: this._latest_origin_query_obj,
        });
    },

    _add_history_object_for_categories_page: function () {
        this._history_presenter.set_current_item({
            page_type: this._CATEGORIES_PAGE,
            article_origin_query_obj: this._latest_origin_query_obj,
        });
    },

    _on_ekn_link_clicked: function (article_presenter, ekn_id) {
        this.engine.get_object_by_id(ekn_id,
                                     null,
                                     (engine, task) => {
            let model;
            try {
                model = engine.get_object_by_id_finish(task);
            } catch (error) {
                logError(error);
                return;
            }

            if (model instanceof MediaObjectModel.MediaObjectModel) {
                this._lightbox_presenter.show_media_object(article_presenter.article_model, model);
            } else {
                this._add_history_object_for_article_page(model);
                this.article_presenter.load_article(model, EosKnowledgePrivate.LoadingAnimationType.FORWARDS_NAVIGATION);

                if (this._template_type === 'B')
                    this.view.section_page.highlight_card_with_name(model.title, this._latest_article_card_title);
            }
        });
    },

    _on_back: function () {
        let visible_page = this.view.get_visible_page();
        if (visible_page === this.view.article_page) {
            if (this._search_origin_page === this.view.home_page) {
                this._add_history_object_for_home_page();
                this.view.show_home_page();
            } else {
                if (this._latest_section_model) {
                    this._add_history_object_for_section_page(this._latest_section_model,
                        this._latest_origin_query_obj);
                } else {
                    this._add_history_object_for_search_page(this._latest_origin_query_obj);
                }
                this.view.show_section_page();
            }
            if (this._template_type === 'B')
                this.view.section_page.clear_highlighted_cards();
        } else if (visible_page === this.view.section_page || visible_page === this.view.no_search_results_page) {
            if (this._original_page === this.view.home_page) {
                this._add_history_object_for_home_page();
                this.view.show_home_page();
            } else if (this._original_page === this.view.categories_page) {
                this.view.show_categories_page();
            }
        } else {
            // Do nothing
        }
    },

    _load_section_page: function (model, engine, task) {
        let results, get_more_results_query;
        try {
            [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
        } catch (error) {
            logError(error);
            return;
        }

        this.view.section_page.model = model;
        this._latest_section_model = model;
        this._set_section_page_content(results);
        this._get_more_results_query = get_more_results_query;
        this._search_origin_page = this.view.section_page;
        this.view.unlock_ui();
        this.view.show_section_page();
    },

    _load_query_page: function (query, engine, task) {
        let results, get_more_results_query;
        try {
            [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
        } catch (error) {
            logError(error);
            return;
        }

        if (results.length === 0) {
            this._latest_section_model = null;
            this._history_presenter.history_model.current_item.empty = true;
            this.view.no_search_results_page.query = query.query;
            this._search_origin_page = this.view.section_page;
            this.view.unlock_ui();
            this.view.show_no_search_results_page();
        } else {
            this.view.section_page.query = query;
            this._latest_origin_query_obj = query;
            this._latest_section_model = null;
            this._set_section_page_content(results);
            this._get_more_results_query = get_more_results_query;
            this._search_origin_page = this.view.section_page;
            this.view.unlock_ui();
            this.view.show_section_page();
        }
    },

    _set_section_page_content: function (results) {
        let cards = results.map(this._new_card_from_article_model.bind(this));
        if (this._template_type === 'B') {
            this.view.section_page.cards = cards;
        } else {
            let article_segment_title = _("Articles");
            this.view.section_page.remove_all_segments();
            this.view.section_page.append_to_segment(article_segment_title, cards);
        }
    },

    _new_card_from_article_model: function (model) {
        let card = this.factory.create_named_module('results-card', {
            model: model,
        });
        card.connect('clicked', function () {
            this._on_article_card_clicked(card, model);
        }.bind(this));

        if (this._template_type !== 'B')
            card.fade_in();

        return card;
    },
});
