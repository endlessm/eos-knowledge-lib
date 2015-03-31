/* global private_imports */

const EosKnowledge = imports.gi.EosKnowledge;
const EosKnowledgeSearch = imports.EosKnowledgeSearch;
const Endless = imports.gi.Endless;
const Format = imports.format;
const Gio = imports.gi.Gio;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ArticleCard = private_imports.articleCard;
const ArticlePresenter = private_imports.articlePresenter;
const CardA = private_imports.cardA;
const CardB = private_imports.cardB;
const Config = private_imports.config;
const Launcher = private_imports.launcher;
const HistoryItem = private_imports.historyItem;
const MediaInfobox = private_imports.mediaInfobox;
const PdfCard = private_imports.pdfCard;
const Previewer = private_imports.previewer;
const TextCard = private_imports.textCard;
const WebkitURIHandlers = private_imports.webkitURIHandlers;
const Window = private_imports.window;
const Utils = private_imports.utils;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const RESULTS_SIZE = 10;

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
    Extends: Launcher.Launcher,
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

        let css = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_knowledge.css');
        Utils.add_css_provider_from_file(css, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        props.view = props.view || new Window.Window({
            application: props.application,
            template_type: this._template_type,
        });
        props.engine = props.engine || EosKnowledgeSearch.Engine.get_default();
        props.article_presenter = props.article_presenter || new ArticlePresenter.ArticlePresenter({
                article_view: props.view.article_page,
                template_type: this._template_type,
        });
        this.parent(props);

        WebkitURIHandlers.register_webkit_uri_handlers();

        this.view.title = app_json['appTitle'];
        this.view.home_page.title_image_uri = app_json['titleImageURI'];
        this.view.background_image_uri = app_json['backgroundHomeURI'];
        this.view.blur_background_image_uri = app_json['backgroundSectionURI'];
        this._set_sections(app_json['sections']);

        this._previewer = new Previewer.Previewer({
            visible: true
        });
        this.view.lightbox.content_widget = this._previewer;
        this._loading_new_lightbox = false;

        // Keeps track of the broad query that led to an individual article.
        this._latest_origin_query = '{}';
        this._latest_article_card_title = '';
        this._latest_search_text = '';
        this._target_page_title = '';
        this._history_model = new EosKnowledge.HistoryModel();
        this._add_history_object_for_home_page();

        // Connect signals
        this.view.connect('back-clicked', this._on_topbar_back_clicked.bind(this));
        this.view.connect('forward-clicked', this._on_topbar_forward_clicked.bind(this));
        this._history_model.bind_property('can-go-forward', this.view.history_buttons.forward_button, 'sensitive',
            GObject.BindingFlags.SYNC_CREATE);
        this._history_model.bind_property('can-go-back', this.view.history_buttons.back_button, 'sensitive',
            GObject.BindingFlags.SYNC_CREATE);
        this.view.connect('search-focused', this._on_search_focus.bind(this));
        this.view.connect('search-text-changed', this._on_search_text_changed.bind(this));
        this.view.connect('search-entered', function (view, query) {
            this._update_ui_and_search(query);
        }.bind(this));
        this.view.connect('article-selected', this._on_article_selection.bind(this));

        this.view.connect('sidebar-back-clicked', this._on_back.bind(this));
        this.view.connect('lightbox-nav-previous-clicked', this._on_lightbox_previous_clicked.bind(this));
        this.view.connect('lightbox-nav-next-clicked', this._on_lightbox_next_clicked.bind(this));

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

    // EosKnowledge.Launcher override
    desktop_launch: function (timestamp) {
        this.view.present_with_time(timestamp);
    },

    _on_load_more_results: function () {
        this._get_more_results(RESULTS_SIZE, function (err, results, get_more_results_func) {
            if (err !== undefined) {
                printerr(err);
                printerr(err.stack);
            } else {
                let cards = results.map(this._new_card_from_article_model.bind(this));
                if (cards.length > 0) {
                    if (this._template_type === 'B') {
                        this.view.section_page.cards = this.view.section_page.cards.concat(cards);
                    } else {
                        let article_segment_title = _("Articles");
                        this.view.section_page.append_to_segment(article_segment_title, cards);
                    }
                }
                this._get_more_results = get_more_results_func;
            }
        }.bind(this));
    },

    /*
     * Navigates to the previous page by moving the history model back a page and checking the
     * history object for information to replicate that previous page's query.
     */
    _on_topbar_back_clicked: function () {
        this.view.lightbox.reveal_overlays = false;
        this._history_model.go_back();
        this._replicate_history_state(EosKnowledge.LoadingAnimationType.BACKWARDS_NAVIGATION);
    },

    /*
     * Navigates to the next page by moving the history model forward a page and checking the
     * history object for information to replicate that next page's query.
     */
    _on_topbar_forward_clicked: function () {
        this.view.lightbox.reveal_overlays = false;
        this._history_model.go_forward();
        this._replicate_history_state(EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION);
    },

    _replicate_history_state: function (animation_type) {
        let article_origin_query = JSON.parse(this._history_model.current_item.article_origin_query);
        switch (this._history_model.current_item.page_type) {
            case this._SEARCH_PAGE:
                this._perform_search(this.view, JSON.parse(this._history_model.current_item.query));
                break;
            case this._SECTION_PAGE:
                this._target_page_title = this._history_model.current_item.title;
                this.engine.get_objects_by_query(article_origin_query, this._load_section_page.bind(this));
                break;
            case this._ARTICLE_PAGE:
                if (this._history_model.current_item.article_origin_query !== this._latest_origin_query) {
                    this.engine.get_objects_by_query(article_origin_query, this._refresh_sidebar_callback.bind(this));
                }
                this.article_presenter.load_article(this._history_model.current_item.article_model, animation_type);
                // For Template B, we reset the highlight to the card with the same title
                if (this._template_type === 'B')
                    this.view.section_page.highlight_card_with_name(
                        this._history_model.current_item.title,
                        this._history_model.current_item.article_origin_page
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
        if (this._history_model.current_item.article_origin_query !== this._latest_origin_query) {
            this._latest_origin_query = this._history_model.current_item.article_origin_query;
        }
    },

    _refresh_sidebar_callback: function (err, results, get_more_results_func) {
        this._set_section_page_content(results);
        this._get_more_results = get_more_results_func;
    },

    _set_sections: function(sections) {
        let new_card_from_section = (section) => {
            let card;
            let title = section['title'].charAt(0).toUpperCase() + section['title'].slice(1);
            if (this._template_type === 'A') {
                card = new CardA.CardA({
                    title: title,
                });
            } else {
                card = new CardB.CardB({
                    title: title,
                });
            }

            if (section.hasOwnProperty('thumbnailURI')) {
                card.thumbnail_uri = section['thumbnailURI'];
            } else {
                // log a warning that this category is missing its thumbnail
                printerr("WARNING: Missing category thumbnail for " + title);
            }

            if (section.hasOwnProperty('featured')) {
                card.featured = section['featured'];
            }

            card.connect('clicked', this._on_section_card_clicked.bind(this, section['tags']));
            return card;
        }

        if (this._template_type === 'A') {
            for (let page of [this.view.home_page, this.view.categories_page]) {
                let category_cards = sections.map(new_card_from_section);
                page.cards = category_cards;
            }
        } else {
            this.view.home_page.cards = sections.map(new_card_from_section);
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

    _on_section_card_clicked: function (tags, card) {
        this.view.lock_ui();

        let query = {
            'tags': tags,
            'limit': RESULTS_SIZE
        }
        this._target_page_title = card.title;
        this._add_history_object_for_section_page(JSON.stringify(query));
        this.engine.get_objects_by_query(query, this._load_section_page.bind(this));
    },

    // EosKnowledge.launcher override
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
        let query_obj = {
            q: query,
            limit: RESULTS_SIZE,
        };

        this.view.search_box.text = query;
        this._add_history_object_for_search_page(JSON.stringify(query_obj));
        this._perform_search(this.view, query_obj);
    },

    _perform_search: function (view, query) {
        this._search_query = query.q;
        /* TRANSLATORS: this appears on top of the search results page; %s will
        be replaced with the string that the user searched for. */
        this._target_page_title = _("Results for \"%s\"").format(query.q);
        this.view.lock_ui();

        // We clear the search box in the home page after each search.
        // The topbar search box should also clear once an article has been chosen.
        this.view.home_page.search_box.text = '';

        this.engine.get_objects_by_query(query, this._load_section_page.bind(this));
    },

    _on_search_focus: function (view, focused) {
        // If the user focused the search box, ensure that the lightbox is hidden
        this.view.lightbox.reveal_overlays = false;
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

        return obj.title
    },

    _on_search_text_changed: function (view, entry) {
        let query = Utils.sanitize_query(entry.text);
        this._latest_search_text = query;
        // Ignore empty queries
        if (query.length === 0) {
            return;
        }
        this.engine.get_objects_by_query({
            'q': query,
            'limit': RESULTS_SIZE,
        }, function (err, results) {
            if (err !== undefined) {
                printerr(err);
                printerr(err.stack);
            } else {
                entry.set_menu_items(results.map(function (obj) {
                    return {
                        title: this._get_prefixed_title(obj, query),
                        id: obj.ekn_id
                    };
                }.bind(this)));
                this._autocomplete_results = results;
            }
        }.bind(this));
    },

    _on_article_selection: function (view, id) {
        if (view === this.view.home_page) {
            this._search_origin_page = this.view.home_page;
        } else {
            this._search_origin_page = this.view.section_page;
        }

        this._latest_origin_query = JSON.stringify({
            'q': this._latest_search_text
        });
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
        this.article_presenter.load_article(selected_model, EosKnowledge.LoadingAnimationType.NONE, function () {
            this.view.show_article_page();
        }.bind(this));
    },

    // EosKnowledge.Launcher override
    activate_search_result: function (timestamp, ekn_id, query) {
        let query_obj = {
            'q': query,
            'limit': RESULTS_SIZE,
        };
        this.engine.get_objects_by_query(query_obj, this._refresh_sidebar_callback.bind(this));
        this._latest_origin_query = JSON.stringify(query_obj);

        this.engine.get_object_by_id(ekn_id, function (err, model) {
            if (err !== undefined) {
                printerr(err);
                printerr(err.stack);
            } else {
                this._add_history_object_for_article_page(model);
                this.article_presenter.load_article(model, EosKnowledge.LoadingAnimationType.NONE,
                                                    function () {
                                                        this.view.search_box.text = query;
                                                        this.view.show_article_page();
                                                    }.bind(this));
            }
        }.bind(this));
        this.view.present_with_time(timestamp);
    },

    _on_article_card_clicked: function (card, model) {
        let animation_type = this.view.get_visible_page() !== this.view.article_page ? EosKnowledge.LoadingAnimationType.NONE : EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION;

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
        this._history_model.current_item = new HistoryItem.HistoryItem({
            title: model.title,
            page_type: this._ARTICLE_PAGE,
            article_model: model, 
            query: '',
            article_origin_query: this._latest_origin_query,
            article_origin_page: this._latest_article_card_title,
        });
    },

    _add_history_object_for_search_page: function (query) {
        this._latest_origin_query = query;
        this._history_model.current_item = new HistoryItem.HistoryItem({
            title: this._target_page_title,
            page_type: this._SEARCH_PAGE,
            article_model: null, 
            query: query,
            article_origin_query: this._latest_origin_query,
        });
    },

    _add_history_object_for_section_page: function (query) {
        this._latest_origin_query = query;
        this._history_model.current_item = new HistoryItem.HistoryItem({
            title: this._target_page_title,
            page_type: this._SECTION_PAGE,
            article_model: null, 
            query: query,
            article_origin_query: this._latest_origin_query,
        });
    },

    _add_history_object_for_home_page: function () {
        this._history_model.current_item = new HistoryItem.HistoryItem({
            title: '',
            page_type: this._HOME_PAGE,
            article_model: null,
            query: '', 
            article_origin_query: this._latest_origin_query,
        });
    },

    _add_history_object_for_categories_page: function () {
        this._history_model.current_item = new HistoryItem.HistoryItem({
            title: '',
            page_type: this._CATEGORIES_PAGE,
            article_model: null,
            query: '',
            article_origin_query: this._latest_origin_query,
        });
    },

    _on_ekn_link_clicked: function (article_presenter, ekn_id) {
        this.engine.get_object_by_id(ekn_id, function (err, model) {
            if (typeof err === 'undefined') {
                if (model instanceof EosKnowledgeSearch.MediaObjectModel) {
                    let resources = this.article_presenter._article_model.get_resources();
                    // Checks whether forward/back arrows should be displayed.
                    let current_index = resources.indexOf(ekn_id);
                    if (current_index > -1)
                        this._preview_media_object(model, current_index > 0, current_index < resources.length - 1);
                } else {
                    this._add_history_object_for_article_page(model);
                    this.article_presenter.load_article(model, EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION);

                    if (this._template_type === 'B')
                        this.view.section_page.highlight_card_with_name(model.title, this._latest_article_card_title);
                }
            } else {
                printerr(err);
                printerr(err.stack);
            }
        }.bind(this));
    },

    _on_lightbox_previous_clicked: function (view, lightbox) {
        this._lightbox_shift_image(lightbox, -1);
    },

    _on_lightbox_next_clicked: function (view, lightbox) {
        this._lightbox_shift_image(lightbox, 1);
    },

    _lightbox_shift_image: function (lightbox, delta) {
        let resources = this.article_presenter._article_model.get_resources();
        let current_index = resources.indexOf(lightbox.media_object.ekn_id);
        if (current_index > -1 && !this._loading_new_lightbox) {
            this._loading_new_lightbox = true;
            let new_index = current_index + delta;
            this.engine.get_object_by_id(resources[new_index], (err, object) => {
                this._loading_new_lightbox = false;
                if (err !== undefined) {
                    printerr(err);
                    printerr(err.stack);
                } else {
                    this._preview_media_object(object, new_index > 0, new_index < resources.length - 1);
                }
            });
        }
    },

    _on_back: function () {
        let visible_page = this.view.get_visible_page();
        if (visible_page === this.view.article_page) {
            if (this._search_origin_page === this.view.home_page) {
                this._add_history_object_for_home_page();
                this.view.show_home_page();
            } else {
                this._add_history_object_for_section_page(this._latest_origin_query);
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

    _load_section_page: function (err, results, get_more_results_func) {
        if (err !== undefined) {
            printerr(err);
            printerr(err.stack);
        } else if (results.length === 0) {
            this.view.no_search_results_page.query = this._search_query;
            this._search_origin_page = this.view.section_page;
            this.view.unlock_ui();
            this.view.show_no_search_results_page();
        } else {
            this.view.section_page.title = this._target_page_title;
            this._set_section_page_content(results);
            this._get_more_results = get_more_results_func;
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
        let fade_in = true;
        let card_class = ArticleCard.ArticleCard;
        // If it has a content_uri, assume it is a PDF.
        // This may need to change in the future but for now
        // I think it's the simplest approach and avoids having
        // to do a file I/O to get mime type for every card.
        if (model.content_uri.length > 0) {
            card_class = PdfCard.PdfCard;
        } else if (this._template_type === 'B') {
            fade_in = false;
            card_class = TextCard.TextCard;
        }
        let card = new card_class({
            title: model.title,
            synopsis: model.synopsis,
            fade_in: fade_in,
        });
        card.connect('clicked', function () {
            this._on_article_card_clicked(card, model);
        }.bind(this));
        return card;
    },

    _preview_media_object: function (media_object, previous_arrow_visible, next_arrow_visible) {
        let infobox = MediaInfobox.MediaInfobox.new_from_ekn_model(media_object);
        this._previewer.file = Gio.File.new_for_uri(media_object.content_uri);
        this.view.lightbox.media_object = media_object;
        this.view.lightbox.infobox_widget = infobox;
        this.view.lightbox.reveal_overlays = true;
        this.view.lightbox.has_back_button = previous_arrow_visible;
        this.view.lightbox.has_forward_button = next_arrow_visible;
    }
});
