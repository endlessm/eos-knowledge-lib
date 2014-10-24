const EosKnowledge = imports.gi.EosKnowledge;
const Endless = imports.gi.Endless;
const Format = imports.format;
const Gio = imports.gi.Gio;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const System = imports.system;

const ArticleCard = imports.articleCard;
const ArticleObjectModel = imports.articleObjectModel;
const ArticlePresenter = imports.articlePresenter;
const CardA = imports.cardA;
const CardB = imports.cardB;
const Config = imports.config;
const Engine = imports.engine;
const MediaInfobox = imports.mediaInfobox;
const PdfCard = imports.pdfCard;
const Previewer = imports.previewer;
const TextCard = imports.textCard;
const Window = imports.window;

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
    Extends: GObject.Object,
    _ARTICLE_PAGE: 'article',
    _HOME_PAGE: 'home',
    _SEARCH_PAGE: 'search',
    _SECTION_PAGE: 'section',
    _CATEGORIES_PAGE: 'categories',

    _init: function (app, app_filename, props) {
        this.parent(props);

        let app_content = this._parse_object_from_path(app_filename);
        this._template_type = app_content['templateType'];
        this.view = new Window.Window({
            application: app,
            template_type: this._template_type,
            title: app_content['appTitle'],
        });
        this._previewer = new Previewer.Previewer({
            visible: true
        });
        this.view.lightbox.content_widget = this._previewer;

        try {
            this._setAppContent(app_content);
        } catch(e) {
            printerr(e);
            printerr(e.stack);
            System.exit(1);
        }

        this._engine = new Engine.Engine();
        // Ping server to spin up knowledge engine
        this._engine.ping(this._domain);

        // Keeps track of the broad query that led to an individual article.
        this._latest_origin_query = '{}';
        this._latest_article_card_title = '';
        this._latest_search_text = '';
        this._target_page_title = '';
        this._history_model = new EosKnowledge.HistoryModel();
        this._add_history_object_for_home_page();
        this._article_presenter = new ArticlePresenter.ArticlePresenter({
            article_view: this.view.article_page,
            engine: this._engine,
            template_type: this._template_type
        });

        // Connect signals
        this.view.connect('back-clicked', this._on_topbar_back_clicked.bind(this));
        this.view.connect('forward-clicked', this._on_topbar_forward_clicked.bind(this));
        this._history_model.bind_property('can-go-forward', this.view.history_buttons.forward_button, 'sensitive',
            GObject.BindingFlags.SYNC_CREATE);
        this._history_model.bind_property('can-go-back', this.view.history_buttons.back_button, 'sensitive',
            GObject.BindingFlags.SYNC_CREATE);
        this.view.connect('search-focused', this._on_search_focus.bind(this));
        this.view.connect('search-text-changed', this._on_search_text_changed.bind(this));
        this.view.connect('search-entered', this._on_search.bind(this));
        this.view.connect('article-selected', this._on_article_selection.bind(this));

        this.view.connect('sidebar-back-clicked', this._on_back.bind(this));
        this.view.connect('lightbox-nav-previous-clicked', this._on_lightbox_previous_clicked.bind(this));
        this.view.connect('lightbox-nav-next-clicked', this._on_lightbox_next_clicked.bind(this));

        this.view.home_page.connect('search-entered', this._on_search.bind(this));
        this.view.home_page.connect('search-text-changed', this._on_search_text_changed.bind(this));
        this.view.home_page.connect('article-selected', this._on_article_selection.bind(this));

        this.view.section_page.connect('load-more-results', this._on_load_more_results.bind(this));

        this.view.home_page.connect('show-categories', this._on_categories_button_clicked.bind(this));
        this._article_presenter.connect('media-object-clicked', this._on_media_object_clicked.bind(this));
        this._article_presenter.connect('article-object-clicked', this._on_article_object_clicked.bind(this));
        this.view.categories_page.connect('show-home', this._on_home_button_clicked.bind(this));
        this._original_page = this.view.home_page;
        this._search_origin_page = this.view.home_page;
        this._autocomplete_results = [];
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
                this._engine.get_objects_by_query(this._domain, article_origin_query, this._load_section_page.bind(this));
                break;
            case this._ARTICLE_PAGE:
                if (this._history_model.current_item.article_origin_query !== this._latest_origin_query) {
                    this._engine.get_objects_by_query(this._domain, article_origin_query, this._refresh_sidebar_callback.bind(this));
                }
                this._article_presenter.load_article(this._history_model.current_item.article_model, animation_type);
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

    _setAppContent: function(data) {
        this._domain = data['appId'].split('.').pop();
        this.view.home_page.title_image_uri = data['titleImageURI'];
        this.view.background_image_uri = data['backgroundHomeURI'];
        this.view.blur_background_image_uri = data['backgroundSectionURI'];
        if (this._template_type === 'B') {
            this.view.home_page.cards = data['sections'].map(function (section) {
                let card = new CardB.CardB({
                    title: section['title'].charAt(0).toUpperCase() + section['title'].slice(1),
                    thumbnail_uri: section['thumbnailURI']
                });
                card.connect('clicked', this._on_section_card_clicked.bind(this, section['tags']));
                return card;
            }.bind(this));
        } else {
            for (let page of [this.view.home_page, this.view.categories_page]) {
                let category_cards = data['sections'].map(function (section) {
                    let card = new CardA.CardA({
                        title: section['title'].charAt(0).toUpperCase() + section['title'].slice(1),
                        thumbnail_uri: section['thumbnailURI']
                    });
                    card.connect('clicked', this._on_section_card_clicked.bind(this, section['tags']));
                    return card;
                }.bind(this));
                page.cards = category_cards;
            }
        }
    },

    _parse_object_from_path: function (path) {
        let file = Gio.file_new_for_uri(path);
        let [success, data] = file.load_contents(null);
        return JSON.parse(data);
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
            'tag': tags,
            'limit': RESULTS_SIZE
        }
        this._target_page_title = card.title;
        this._add_history_object_for_section_page(JSON.stringify(query));
        this._engine.get_objects_by_query(this._domain, query, this._load_section_page.bind(this));
    },

    // Removes newlines and trims whitespace before and after a query string
    _sanitize_query: function (query) {
        // Crazy regex for line breaks from
        // http://stackoverflow.com/questions/10805125/how-to-remove-all-line-breaks-from-a-string
        return query.replace(/\r?\n|\r/g, ' ').trim();
    },

    _on_search: function (view, query) {
        query = this._sanitize_query(query);
        // Ignore empty queries
        if (query.length === 0) {
            return;
        }

        this.view.search_box.text = query;
        this._add_history_object_for_search_page(JSON.stringify({
            q: query
        }));
        this._perform_search(view, {
            q: query
        });
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

        this._engine.get_objects_by_query(this._domain, query, this._load_section_page.bind(this));
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
        let query = this._sanitize_query(entry.text);
        this._latest_search_text = query;
        // Ignore empty queries
        if (query.length === 0) {
            return;
        }
        this._engine.get_objects_by_query(this._domain, {
            'prefix': query
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
            'prefix': this._latest_search_text
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
        this._article_presenter.load_article(selected_model, EosKnowledge.LoadingAnimationType.NONE, function () {
            this.view.show_article_page();
        }.bind(this));
    },

    on_search_result_activated: function (model, query, results, more_results_callback) {
        let query_obj = {
            'q': query,
        };
        this._refresh_sidebar_callback(null, results, more_results_callback);

        this._latest_origin_query = JSON.stringify(query_obj);
        this._add_history_object_for_article_page(model);
        this._article_presenter.load_article(model, EosKnowledge.LoadingAnimationType.NONE,
            function () {
                this.view.search_box.text = query;
                this.view.show_article_page();
            }.bind(this));
    },

    _on_article_card_clicked: function (card, model) {
        let animation_type = this.view.get_visible_page() !== this.view.article_page ? EosKnowledge.LoadingAnimationType.NONE : EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION;
        model.fetch_all(this._engine);

        // Grab the title of the latest article card clicked.
        // All subsequent navigations from this article page need to add a visual cue to this card.
        this._latest_article_card_title = model.title;

        this._add_history_object_for_article_page(model);
        this._article_presenter.load_article(model, animation_type, function () {
            this.view.show_article_page();
        }.bind(this));
        if (this._template_type === 'B')
            this.view.section_page.highlight_card(card);
    },

    _add_history_object_for_article_page: function (model) {
        this._history_model.current_item = new HistoryItem({
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
        this._history_model.current_item = new HistoryItem({
            title: this._target_page_title,
            page_type: this._SEARCH_PAGE,
            article_model: null, 
            query: query,
            article_origin_query: this._latest_origin_query,
        });
    },

    _add_history_object_for_section_page: function (query) {
        this._latest_origin_query = query;
        this._history_model.current_item = new HistoryItem({
            title: this._target_page_title,
            page_type: this._SECTION_PAGE,
            article_model: null, 
            query: query,
            article_origin_query: this._latest_origin_query,
        });
    },

    _add_history_object_for_home_page: function () {
        this._history_model.current_item = new HistoryItem({
            title: '',
            page_type: this._HOME_PAGE,
            article_model: null,
            query: '', 
            article_origin_query: this._latest_origin_query,
        });
    },

    _add_history_object_for_categories_page: function () {
        this._history_model.current_item = new HistoryItem({
            title: '',
            page_type: this._CATEGORIES_PAGE,
            article_model: null,
            query: '',
            article_origin_query: this._latest_origin_query,
        });
    },

    _on_media_object_clicked: function (article_presenter, media_object, is_resource) {
        if (is_resource) {
            let resources = this._article_presenter._article_model.get_resources();
            let current_index = resources.indexOf(media_object);
            // Checks whether forward/back arrows should be displayed.
            this._preview_media_object(media_object, current_index > 0, current_index < resources.length - 1);
        } else {
            this._preview_media_object(media_object, false, false);
        }
    },

    _on_article_object_clicked: function (article_presenter, model) {
        this._add_history_object_for_article_page(model);
        this._article_presenter.load_article(model, EosKnowledge.LoadingAnimationType.FORWARDS_NAVIGATION);

        if (this._template_type === 'B')
            this.view.section_page.highlight_card_with_name(model.title, this._latest_article_card_title);
    },

    _on_lightbox_previous_clicked: function (view, lightbox) {
        let media_object = lightbox.media_object;
        let resources = this._article_presenter._article_model.get_resources();
        let current_index = resources.indexOf(media_object);
        if (current_index > -1) {
            let new_index = current_index - 1;
            // If the previous object is not the first, the back arrow should be displayed.
            this._preview_media_object(resources[new_index], new_index > 0, true); 
        }
    },

    _on_lightbox_next_clicked: function (view, lightbox) {
        let media_object = lightbox.media_object;
        let resources = this._article_presenter._article_model.get_resources();
        let current_index = resources.indexOf(media_object);
        if (current_index > -1) {
            let new_index = current_index + 1;
            // If the next object is not the last, the forward arrow should be displayed.
            this._preview_media_object(resources[new_index], true, new_index < resources.length - 1);
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

/**
 * Class: HistoryItem
 *
 * An object to be used by a HistoryModel in order to keep track of the pages
 * that a user visits. Each HistoryItem contains the properties necessary
 * to recreate that page. This includes query parameters in the case of search
 * and article pages.
 *
 */
const HistoryItem = new Lang.Class({
    Name: 'HistoryItem',
    Extends: GObject.Object,
    Implements: [ EosKnowledge.HistoryItemModel ],
    Properties: {
        /**
         * Property: title
         *
         * The string used in recreating the title of a page.
         */
        'title': GObject.ParamSpec.string('title', 'override', 'override',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        /**
         * Property: page-type
         *
         * A string that stores the type of page that corresponds to a history item.
         * Supported page types are 'search', 'section', 'article', and 'home'.
         */
        'page-type': GObject.ParamSpec.string('page-type', 'Page Type',
            'The type of page of the history object. Either \'search\', \'section\', \'article\', or \'home\'',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
        /**
         * Property: article-model
         *
         * An <ArticleObjectModel> that stores the information used to replicate an article
         * on a page of type 'article'.
         */
        'article-model': GObject.ParamSpec.object('article-model', 'Article model',
            'The article object model handled by this widget. Only not null for pages of type \'article\'',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ArticleObjectModel.ArticleObjectModel),
        /**
         * Property: query
         *
         * A string that stores the query used in a search or section page request sent to the knowledge engine.
         * It is used to recreate the query and thus display the appropriate information to a user that returns
         * to this item in the history.
         */
        'query': GObject.ParamSpec.string('query', 'Query',
            'A JSON string representing the query for a search or section page.',
            GObject.ParamFlags.READWRITE, ''),
        /**
         * Property: article-origin-query
         *
         * A string used to store the search or section query that eventually led to the user reaching this
         * history item. This query is used to replicate the list of titles that were available to a user
         * when they first selected this history item (currently only used in Template B apps).
         */
        'article-origin-query': GObject.ParamSpec.string('article-origin-query', 'Article Origin Query',
            'A JSON query that was used to generate the list of articles from which this object was chosen.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
        /**
         * Property: article-origin-page
         *
         * A string that stores the title of the article page from which the user naviated to this
         * page.
         */
        'article-origin-page': GObject.ParamSpec.string('article-origin-page', 'Article Origin Page',
            'A string that stores the title of the article page from which the user navigated to this page',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, ''),
    }
});
