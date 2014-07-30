const EosKnowledge = imports.gi.EosKnowledge;
const Endless = imports.gi.Endless;
const Format = imports.format;
const Gio = imports.gi.Gio;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const System = imports.system;

const ArticleCard = imports.articleCard;
const ArticlePresenter = imports.articlePresenter;
const CardA = imports.cardA;
const CardB = imports.cardB;
const Config = imports.config;
const Engine = imports.engine;
const MediaInfobox = imports.mediaInfobox;
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

    _init: function (app, app_filename, props) {
        this.parent(props);

        let app_content = this._parse_object_from_path(app_filename);
        this._template_type = app_content['templateType'];
        this.view = new Window.Window({
            application: app,
            template_type: this._template_type
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

        this._history_model = new EosKnowledge.HistoryModel();
        this._article_presenter = new ArticlePresenter.ArticlePresenter({
            article_view: this.view.article_page,
            history_model: this._history_model,
            engine: this._engine,
            template_type: this._template_type
        });

        // Connect signals
        this.view.connect('back-clicked', this._on_topbar_back_clicked.bind(this));
        this.view.connect('forward-clicked', this._on_topbar_forward_clicked.bind(this));
        this._history_model.connect('notify::can-go-forward', this._update_history_buttons.bind(this));
        this._history_model.connect('notify::can-go-back', this._update_history_buttons.bind(this));
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
        this.view.categories_page.connect('show-home', this._on_home_button_clicked.bind(this));
        this._original_page = this.view.home_page;
        this._search_origin_page = this.view.home_page;
        this._autocomplete_results = [];
        this._update_history_buttons();
    },

    _update_history_buttons: function () {
        this.view.history_buttons.forward_button.sensitive = false;
        this.view.history_buttons.back_button.sensitive = false;
        if (this.view.get_visible_page() === this.view.article_page) {
            if (this._history_model.can_go_forward) {
                this.view.history_buttons.forward_button.sensitive = true;
            }
            if (this._history_model.can_go_back) {
                this.view.history_buttons.back_button.sensitive = true;
            }
        }
    },

    _on_load_more_results: function () {
        this._get_more_results(RESULTS_SIZE, function (err, results, get_more_results_func) {
            if (err !== undefined) {
                printerr(err);
                printerr(err.stack);
            } else {
                let cards = results.map(this._new_card_from_article_model.bind(this));
                if (this._template_type === 'B') {
                    this.view.section_page.cards = this.view.section_page.cards.concat(cards);
                } else {
                    let article_segment_title = _("Articles");
                    this.view.section_page.append_to_segment(article_segment_title, cards);
                }
                this._get_more_results = get_more_results_func;
            }
        }.bind(this));
    },

    _on_topbar_back_clicked: function () {
        this.view.lightbox.reveal_overlays = false;
        this._article_presenter.navigate_back();
    },

    _on_topbar_forward_clicked: function () {
        this.view.lightbox.reveal_overlays = false;
        this._article_presenter.navigate_forward();
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
        this.view.show_categories_page();
    },

    _on_home_button_clicked: function (button) {
        this._original_page = this.view.home_page;
        this.view.show_home_page();
    },

    _on_section_card_clicked: function (tags, card) {
        this.view.lock_ui();

        let query = {
            'tag': tags,
            'limit': RESULTS_SIZE
        }
        this._engine.get_objects_by_query(this._domain, query, this._load_section_page.bind(this));
        this.view.section_page.title = card.title;
    },

    _on_search: function (view, query) {
        // Ignore empty queries
        if (!(query.trim())) {
            return;
        }
        this.view.lock_ui();
        this._engine.get_objects_by_query(this._domain, {
            'q': query
        }, this._load_section_page.bind(this));
        /* TRANSLATORS: this appears on top of the search results page; %s will
        be replaced with the string that the user searched for. */
        this.view.section_page.title = _("Results for %s").format(query);
    },

    _on_search_focus: function (view, focused) {
        // If the user focused the search box, ensure that the lightbox is hidden
        this.view.lightbox.reveal_overlays = false;
    },

    _on_search_text_changed: function (view, entry) {
        // Ignore empty queries
        if (!(entry.text.trim())) {
            return;
        }
        this._engine.get_objects_by_query(this._domain, {
            'prefix': entry.text
        }, function (err, results) {
            if (err !== undefined) {
                printerr(err);
                printerr(err.stack);
            } else {
                entry.set_menu_items(results.map(function (obj) {
                    return {
                        title: obj.title,
                        id: obj.ekn_id
                    };
                }));
                this._autocomplete_results = results;
            }
        }.bind(this));
    },

    _on_article_selection: function (view, id) {
        this.view.lock_ui();
        if (view === this.view.home_page) {
            this._search_origin_page = this.view.home_page;
        } else {
            this._search_origin_page = this.view.section_page;
        }

        // If template B, we need to set the autocomplete results as the cards on the
        // section page
        if (this._template_type === 'B') {
            let cards = this._autocomplete_results.map(this._new_card_from_article_model.bind(this));
            this.view.section_page.cards = cards;
        }

        let selected_model = this._autocomplete_results.filter(function (element) {
            return element.ekn_id === id
        }, id)[0];
        this._article_presenter.load_article(selected_model);
        this.view.unlock_ui();
        this.view.show_article_page();
    },

    _on_article_card_clicked: function (card, model) {
        if (this.view.get_visible_page() !== this.view.article_page)
            this._article_presenter.animate_load = false;
        model.fetch_all(this._engine);
        this._article_presenter.load_article(model);
        this.view.show_article_page();
        this._article_presenter.animate_load = true;
    },

    _on_media_object_clicked: function (article_presenter, media_object, is_resource) {
        this._preview_media_object(media_object, is_resource);
    },

    _on_lightbox_previous_clicked: function (view, media_object) {
        let resources = this._article_presenter.article_model.get_resources();
        let current_index = this._get_position_in_resources(media_object.ekn_id, resources);
        if (current_index > 0) {
            // If it equals 0, it's the first resource, can't go to previous
            this._preview_media_object(resources[current_index - 1]);
        }
    },

    _on_lightbox_next_clicked: function (view, media_object) {
        let resources = this._article_presenter.article_model.get_resources();
        let current_index = this._get_position_in_resources(media_object.ekn_id, resources);
        if (current_index >= 0 && current_index < resources.length - 1) {
            // If it equals resources.length - 1, it's the last resource, can't go to next
            this._preview_media_object(resources[current_index - 1]);
        }
    },

    _get_position_in_resources: function (article_model_id, resources) {
        let resource_ids = resources.map(function (model) {
            return model.ekn_id;
        });
        return resource_ids.indexOf(article_model_id);
    },

    _on_back: function () {
        let visible_page = this.view.get_visible_page();
        if (visible_page === this.view.article_page) {
            this._article_presenter.history_model.clear();
            if (this._search_origin_page === this.view.home_page) {
                this.view.show_home_page();
            } else {
                this.view.show_section_page();
            }
        } else if (visible_page === this.view.section_page) {
            if (this._original_page === this.view.home_page){
                this.view.show_home_page();
            } else if (this._original_page === this.view.categories_page) {
                this.view.show_categories_page();
            }
        } else {
            // Do nothing
        }
        this._update_history_buttons();
    },

    _load_section_page: function (err, results, get_more_results_func) {
        if (err !== undefined) {
            printerr(err);
            printerr(err.stack);
        } else {
            this._set_section_page_content(results);
            this._get_more_results = get_more_results_func;
            this._search_origin_page = this.view.section_page;
            this.view.unlock_ui();
            this.view.show_section_page();
            this._update_history_buttons();
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
        let card_class = this._template_type === 'B' ? TextCard.TextCard : ArticleCard.ArticleCard;
        let card = new card_class({
            title: model.title,
            synopsis: model.synopsis
        });
        card.connect('clicked', function () {
            this._on_article_card_clicked(card, model);
        }.bind(this));
        return card;
    },

    _preview_media_object: function (media_object, is_resource) {
        let infobox = MediaInfobox.MediaInfobox.new_from_ekn_model(media_object);
        this._previewer.file = Gio.File.new_for_uri(media_object.content_uri);
        this.view.lightbox.media_object = media_object;
        this.view.lightbox.infobox_widget = infobox;
        this.view.lightbox.reveal_overlays = true;
        this.view.lightbox.has_navigation_buttons = is_resource;
    }
});
