const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const System = imports.system;

const WindowA = imports.windowA;

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

    Properties: {
        /**
         * Property: view
         *
         * The <WindowA> widget that acts as a top-level view for the application.
         * Construct-only.
         */
        'view': GObject.ParamSpec.object('view', 'Window view',
            'The top level view component for the application',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            WindowA.WindowA)
    },

    _parse_object_from_path: function (path) {
        let file = Gio.file_new_for_uri(path);
        let [success, data] = file.load_contents(null);
        return JSON.parse(data);
    },

    _setAppContent: function(data) {
        this._domain = data['domain'];
        this.view.background_image_uri = data['backgroundURI'];
        this.view.home_page.title = data['appTitle'];
        this.view.home_page.subtitle = data['appSubtitle'];
        for (let page of [this.view.home_page, this.view.categories_page]) {
            let category_cards = data['sections'].map(function (section) {
                let card = new EosKnowledge.Card({
                    title: section['title'],
                    thumbnail_uri: section['thumbnailURI']
                });
                card.connect('clicked', this._on_section_card_clicked.bind(this, section['tags']));
                return card;
            }.bind(this));
            page.cards = category_cards;
        }
    },

    _initAppInfoFromJsonFile: function(filename) {
        try {
            let app_content = this._parse_object_from_path(filename);
            this._setAppContent(app_content);
        } catch(e) {
            printerr(e);
            if (e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND)) {
                printerr("****** This app does not support the personality",
                      Endless.get_system_personality(), "******");
            }
            System.exit(1);
        }
    },

    _init: function (props, app_filename) {
        this.parent(props);

        this._engine = new EosKnowledge.Engine();

        this._article_presenter = new EosKnowledge.ArticlePresenter({
            article_view: this.view.article_page,
            engine: this._engine
        });

        this._initAppInfoFromJsonFile(app_filename);

        // Connect signals
        this.view.connect('back-clicked', this._on_back.bind(this));
        this.view.connect('forward-clicked', function (view) {
            view.show_article_page();
        });
        this.view.connect('search-text-changed', this._on_search_text_changed.bind(this));
        this.view.connect('search-entered', this._on_search.bind(this));
        this.view.connect('article-selected', this._on_article_selection.bind(this));

        this.view.connect('sidebar-back-clicked', this._on_back.bind(this));

        this.view.home_page.connect('search-entered', this._on_search.bind(this));
        this.view.home_page.connect('search-text-changed', this._on_search_text_changed.bind(this));
        this.view.home_page.connect('article-selected', this._on_article_selection.bind(this));

        this.view.home_page.connect('show-categories', this._on_categories_button_clicked.bind(this));
        this.view.categories_page.connect('show-home', this._on_home_button_clicked.bind(this));
        this._original_page = this.view.home_page;
        this._search_origin_page = this.view.home_page;
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
        this._engine.get_objects_by_query(this._domain, {
            'tag': tags
        }, this._load_section_page.bind(this));
        this.view.section_page.title = card.title;
    },

    _on_search: function (view, query) {
        this._engine.get_objects_by_query(this._domain, {
            'q': query
        }, this._load_section_page.bind(this));
        this.view.section_page.title = "Results for " + query;
    },

    _on_search_text_changed: function (view, entry) {
        this._engine.get_objects_by_query(this._domain, {
            'prefix': entry.text
        }, function (err, results) {
            entry.set_menu_items(results.map(function (obj) {
                return {
                    title: obj.title,
                    id: obj.ekn_id
                };
            }));
        });
    },

    _on_article_selection: function (view, id) {
        if (view === this.view.home_page) {
            this._search_origin_page = this.view.home_page;
        } else {
            this._search_origin_page = this.view.section_page;
        }
        let database_id = id.split('/').pop();
        this._engine.get_object_by_id(this._domain, database_id, Lang.bind(this, function (err, model) {
            this._article_presenter.load_article_from_model(model);
            this.view.show_article_page();
        }));
    },

    _on_article_card_clicked: function (card, model) {
        this._article_presenter.load_article_from_model(model);
        this.view.show_article_page();
    },

    _on_back: function () {
        let visible_page = this.view.get_visible_page();
        if (visible_page === this.view.article_page) {
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
    },

    _load_section_page: function (err, results) {
        if (typeof err !== 'undefined')
            print(err);
        let cards = results.map(this._new_card_from_article_model.bind(this));
        let segments = {
            'Articles': cards
        };
        this._search_origin_page = this.view.section_page;
        this.view.section_page.segments = segments;
        this.view.show_section_page();
    },

    _new_card_from_article_model: function (model) {
        let card = new EosKnowledge.ArticleCard({
            title: model.title,
            thumbnail_uri: model.thumbnail === null? '' : model.thumbnail.content_uri
        });
        card.connect('clicked', function () {
            this._on_article_card_clicked(card, model);
        }.bind(this));
        return card;
    }
});
