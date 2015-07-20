const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Format = imports.format;
const Gettext = imports.gettext;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const ArticleHTMLRenderer = imports.app.articleHTMLRenderer;
const ArticleObjectModel = imports.search.articleObjectModel;
const Config = imports.app.config;
const EncyclopediaModel = imports.app.encyclopedia.model;
const Engine = imports.search.engine;
const HistoryPresenter = imports.app.historyPresenter;
const Launcher = imports.app.launcher;
const LightboxPresenter = imports.app.lightboxPresenter;
const MediaObjectModel = imports.search.mediaObjectModel;
const Previewer = imports.app.previewer;
const QueryObject = imports.search.queryObject;
const WebkitContextSetup = imports.app.webkitContextSetup;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const AUTOCOMPLETE_DELAY = 500; // ms
const SEARCH_BOX_PLACEHOLDER_TEXT = _("Search the world's information!");
const ARTICLE_PAGE = 'article';
const SEARCH_RESULTS_PAGE = 'search-results';

const EncyclopediaPresenter = new Lang.Class({
    Name: 'EncyclopediaPresenter',
    Extends: GObject.Object,
    Implements: [ Launcher.Launcher ],

    Properties: {
        /**
         * Property: application
         * The GApplication for the knowledge app
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
    },

    _init: function(app_json, props) {
        this.parent(props);

        let provider = new Gtk.CssProvider();
        let css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/css/endless_encyclopedia.css');
        provider.load_from_file(css_file);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
            provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        WebkitContextSetup.register_webkit_extensions(this.application.application_id);

        this._model = new EncyclopediaModel.EncyclopediaModel();
        this._view = this.factory.create_named_module('window', {
            application: this.application,
        });

        this._current_article = null;

        WebkitContextSetup.register_webkit_uri_handlers(this._article_render_callback.bind(this));
        this._engine = Engine.Engine.get_default();

        this._renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer();

        for (let page of [this._view.home_page, this._view.content_page]) {
            page.search_box.connect('activate',
                this._on_search_entered.bind(this));
            page.search_box.connect('text-changed',
                this._on_prefix_entered.bind(this));
            page.search_box.connect('menu-item-selected',
                this._on_article_selected.bind(this));
        }

        this._view.home_page.search_box.placeholder_text = SEARCH_BOX_PLACEHOLDER_TEXT;
        this._view.content_page.search_box.placeholder_text = SEARCH_BOX_PLACEHOLDER_TEXT;

        this._previewer = new Previewer.Previewer({
            visible: true,
        });
        this._view.lightbox.content_widget = this._previewer;

        // Whenever there's a pending lightbox load, its cancellable will be
        // stored here
        this._cancel_lightbox_load = null;

        this._history = new EosKnowledgePrivate.HistoryModel();
        this._history_presenter = new HistoryPresenter.HistoryPresenter({
            history_model: this._history,
            history_buttons: this._view.history_buttons,
        });

        this._history.connect('notify::current-item',
            this._on_navigate.bind(this));
        this._view.history_buttons.back_button.connect('clicked', () => {
            this._history_presenter.go_back();
        });
        this._view.history_buttons.forward_button.connect('clicked', () => {
            this._history_presenter.go_forward();
        });
        this._view.content_page.search_module.connect('article-selected', (module, model) => {
            this.load_model(model);
        });
        this._view.content_page.connect('link-clicked', (page, uri) => {
            this.load_uri(uri);
        });
        this._lightbox_presenter = new LightboxPresenter.LightboxPresenter({
            engine: this._engine,
            view: this._view,
            factory: this.factory,
        });
    },

    // Launcher override
    desktop_launch: function (timestamp) {
        if (timestamp)
            this._view.present_with_time(timestamp);
        else
            this._view.present();
    },

    // Launcher override
    search: function (timestamp, query) {
        this.do_search(query);
        this.desktop_launch(timestamp);
    },

    // Launcher override
    activate_search_result: function (timestamp, id, query) {
        this.load_uri(id);
        this.desktop_launch(timestamp);
    },

    _autocompleteCallback: function (search_box, engine, task) {
        let results, get_more_results_query;
        try {
            [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
        } catch (error) {
            logError(error);
            return;
        }

        let titles = results.map((result) => {
            return {
                title: result.title,
                id: result.ekn_id,
            };
        });
        search_box.set_menu_items(titles);
    },

    _on_prefix_entered: function (search_entry) {
        let prefix_query = search_entry.text;

        // This function will be called when the timeout
        // expires. It will send request to get autocomplete results
        let auto_complete_closure = function(){
            this._timeoutId = 0;
            let query_obj = new QueryObject.QueryObject({
                query: prefix_query,
            });
            this._engine.get_objects_by_query(query_obj,
                                              null,
                                              this._autocompleteCallback.bind(this, search_entry));
            return false;
        };

        // If there is already a queued request, (there is a timeout ID)
        // and another key is pressed, then we have to remove that queued
        // request before setting another one
        if (this._timeoutId > 0) {
            Mainloop.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
        this._timeoutId = Mainloop.timeout_add(AUTOCOMPLETE_DELAY,
            auto_complete_closure.bind(this));
    },

    _on_search_entered: function (search_entry) {
        this.do_search(search_entry.text);
    },

    _do_search_in_view: function (query) {
        let search = this._view.content_page.search_module;
        search.start_search(query);
        if (this._view.get_visible_page() === this._view.home_page)
            this._view.show_content_page();
        this._view.content_page.show_search();
        this._view.set_focus_child(null);
        let query_obj = new QueryObject.QueryObject({
            query: query,
        });
        this._engine.get_objects_by_query(query_obj, null, (engine, task) => {
            search.searching = false;
            let results, get_more_results_query;
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                logError(error);
                search.finish_search_with_error(error);
                return;
            }
            search.finish_search(results);
        });
    },

    _load_article_in_view: function (article) {
        this._view.content_page.load_ekn_content(article);
        if (this._view.get_visible_page() === this._view.home_page)
            this._view.show_content_page();
    },

    _article_render_callback: function (article) {
        return this._renderer.render(article, {
            show_title: true,
        });
    },

    _on_article_selected: function (search_entry, ekn_id) {
        this.load_uri(ekn_id);
    },

    _on_navigate: function () {
        let item = this._history_presenter.history_model.current_item;
        switch (item.page_type) {
        case ARTICLE_PAGE:
            this._current_article = item.model;
            this._load_article_in_view(item.model);
            return;
        case SEARCH_RESULTS_PAGE:
            this._do_search_in_view(item.query_obj.query);
            return;
        }
    },

    // PUBLIC METHODS

    load_uri: function (uri) {
        this._engine.get_object_by_id(uri,
                                      null,
                                      (engine, task) => {
            let model;
            try {
                model = engine.get_object_by_id_finish(task);
            } catch (error) {
                logError(error);
                this._view.content_page.search_module.finish_search_with_error();
                this._view.content_page.show_search();
                return;
            }

            this.load_model(model);
        });
    },

    load_model: function (model) {
        if (model instanceof ArticleObjectModel.ArticleObjectModel) {
            this._history_presenter.set_current_item({
                page_type: ARTICLE_PAGE,
                model: model,
            });
        } else if (model instanceof MediaObjectModel.MediaObjectModel) {
            this._lightbox_presenter.show_media_object(this._current_article, model);
        }
    },

    do_search: function (query) {
        query = query.trim();
        if (query.length === 0)
            return;
        // TRANSLATORS: This is the title of the search results page. %s
        // will be replaced by the text that the user searched for. Make
        // sure that %s is in your translation as well.
        let search_title = _("Results for %s").format(query);

        let query_obj = new QueryObject.QueryObject({
            query: query,
        });
        this._history_presenter.set_current_item({
            title: search_title,
            page_type: SEARCH_RESULTS_PAGE,
            query_obj: query_obj,
        });
    },
});
