const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Format = imports.format;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const ArticleHTMLRenderer = imports.app.articleHTMLRenderer;
const ArticleObjectModel = imports.search.articleObjectModel;
const Config = imports.app.config;
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
const ASSETS_PATH = 'resource:///com/endlessm/knowledge/images/';
const LOGO_FILE = 'logo.svg';
const SEARCH_BOX_PLACEHOLDER_TEXT = _("Search the world's information!");
const ARTICLE_PAGE = 'article';
const SEARCH_RESULTS_PAGE = 'search-results';

const EncyclopediaPresenter = new Lang.Class({
    Name: 'EncyclopediaPresenter',
    Extends: GObject.Object,
    Implements: [ Launcher.Launcher ],

    _init: function(view, model, props) {
        this.parent(props);
        this._model = model;
        this._view = view;

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

        let logo_resource = this._getLocalizedResource(ASSETS_PATH, LOGO_FILE);
        this._view.home_page.logo_uri = logo_resource;
        this._view.content_page.logo_uri = logo_resource;

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
            view: this._view,
        });

        this._history.connect('notify::current-item',
            this._on_navigate.bind(this));
        this._view.history_buttons.back_button.connect('clicked', () => {
            this._history_presenter.go_back();
        });
        this._view.history_buttons.forward_button.connect('clicked', () => {
            this._history_presenter.go_forward();
        });
        this._view.content_page.connect('link-clicked', (page, uri) => {
            this.load_uri(uri);
        });
        this._lightbox_presenter = new LightboxPresenter.LightboxPresenter({
            engine: this.engine,
            view: this._view,
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

    _getLocalizedResource: function(resource_path, filename) {
        let languages = GLib.get_language_names();
        let directories = Gio.resources_enumerate_children(resource_path.split('resource://')[1],
                                                       Gio.ResourceLookupFlags.NONE);
        let location = '';
        // Finds the resource appropriate for the current langauge
        // If can't find language, will return file in C/
        for (let i = 0; i < languages.length; i++) {
            let lang_code = languages[i] + '/';
            if (directories.indexOf(lang_code) !== -1) {
                location = resource_path + lang_code + filename;
                break;
            }
        }
        return location;
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
        let ready_id = this._view.content_page.connect('display-ready', () => {
            let page = this._view.content_page;
            page.set_search_result_page_searching(query);
            if (this._view.get_visible_page() === this._view.home_page)
                this._view.show_content_page();
            this._view.content_page.disconnect(ready_id);
            let query_obj = new QueryObject.QueryObject({
                query: query,
            });
            this._engine.get_objects_by_query(query_obj,
                                              null,
                                              (engine, task) => {
                let results, get_more_results_query;
                try {
                    [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
                } catch (error) {
                    logError(error);
                    page.load_error_page();
                    return;
                }

                if (results.length === 0) {
                    page.load_no_results_page(query);
                    return;
                }

                page.set_search_result_page_complete(query, results.map((item) => {
                    return {
                        title: item.title.charAt(0).toUpperCase() + item.title.slice(1),
                        uri: item.ekn_id,
                    };
                }));
            });
        });
        this._view.content_page.load_search_result_page();
    },

    _load_article_in_view: function (article) {
        this._view.content_page.load_ekn_content(article.ekn_id);
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
            this._current_article = item.article_model;
            this._load_article_in_view(item.article_model);
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
                this._view.content_page.load_error_page();
                return;
            }

            if (model instanceof ArticleObjectModel.ArticleObjectModel) {
                this._history_presenter.set_current_item({
                    page_type: ARTICLE_PAGE,
                    article_model: model,
                });
            } else if (model instanceof MediaObjectModel.MediaObjectModel) {
                this._lightbox_presenter.show_media_object(this._current_article, model);
            }
        });
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
