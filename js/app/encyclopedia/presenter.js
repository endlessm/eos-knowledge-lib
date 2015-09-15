// Copyright 2015 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const EosMetrics = imports.gi.EosMetrics;
const Format = imports.format;
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
const HistoryPresenter = imports.app.historyPresenter;
const InArticleSearch = imports.app.encyclopedia.inArticleSearch;
const Launcher = imports.app.launcher;
const MediaObjectModel = imports.search.mediaObjectModel;
const QueryObject = imports.search.queryObject;
const WebKit2 = imports.gi.WebKit2;
const WebkitContextSetup = imports.app.webkitContextSetup;
const Utils = imports.app.utils;

String.prototype.format = Format.format;

const ARTICLE_PAGE = 'article';
const SEARCH_RESULTS_PAGE = 'search-results';
const SEARCH_METRIC = 'a628c936-5d87-434a-a57a-015a0f223838';

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

        this.view = this.factory.create_named_module('window', {
            application: this.application,
        });

        this._current_article = null;

        WebkitContextSetup.register_webkit_uri_handlers(this._article_render_callback.bind(this));
        this._engine = Engine.Engine.get_default();

        this._renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer();

        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.SEARCH_TEXT_ENTERED:
                    this.do_search(payload.text);
                    break;
                case Actions.AUTOCOMPLETE_SELECTED:
                    this.load_uri(payload.model.ekn_id);
                    break;
            }
        });

        this._history = new EosKnowledgePrivate.HistoryModel();
        this._history_presenter = new HistoryPresenter.HistoryPresenter({
            history_model: this._history,
        });
        this._history_presenter.connect('history-item-changed', this._on_history_item_change.bind(this));

        this.view.search_results_page.content_module.content.bottom.connect('article-selected', (module, model) => {
            this.load_model(model);
        });

        this.view.connect('key-press-event', this._on_key_press_event.bind(this));
    },

    // Launcher override
    desktop_launch: function (timestamp) {
        if (timestamp)
            this.view.present_with_time(timestamp);
        else
            this.view.present();
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

    _do_search_in_view: function (item) {
        let search = this.view.search_results_page.content_module.content.bottom;
        let search_banner = this.view.search_results_page.content_module.content.top;
        search_banner.label = Utils.page_title_from_query_object(item.query);
        search.start_search(item.query);
        if (this.view.get_visible_page() !== this.view.search_results_page)
            this.view.show_search_results_page();
        this.view.set_focus_child(null);
        let query_obj = new QueryObject.QueryObject({
            query: item.query,
        });
        this._engine.get_objects_by_query(query_obj, null, (engine, task) => {
            search.searching = false;
            let results, get_more_results_query;
            try {
                [results, get_more_results_query] = engine.get_objects_by_query_finish(task);
            } catch (error) {
                logError(error);
                search.finish_search_with_error(error);
                search_banner.visible = false;
                return;
            }
            search_banner.visible = true;
            if (results.length === 0)
                item.empty = true;
            search.finish_search(results);
        });
    },

    _load_article_in_view: function (article) {
        this.view.article_page.content_module.pack_content_slot({
            model: article,
            show_toc: false,
            show_top_title: false,
        });

        let document_card = this.view.article_page.content_module.content;
        document_card.connect('ekn-link-clicked', (page, uri) => {
            this.load_uri(uri);
        });
        document_card.load_content(null, (card, task) => {
            try {
                card.load_content_finish(task);
                card.content_view.grab_focus();
            } catch (error) {
                logError(error);
            }
        });
        document_card.show_all();

        let webview = document_card.content_view;
        webview.connect('notify::has-focus', this._on_focus.bind(this));
        webview.connect('enter-fullscreen',
            this._on_fullscreen_change.bind(this, true));
        webview.connect('leave-fullscreen',
            this._on_fullscreen_change.bind(this, false));

        if (this.view.get_visible_page() !== this.view.lightbox)
            this.view.show_article_page();
    },

    _on_focus: function (webview) {
        let script = "webview_focus = " + webview.has_focus + ";";
        this._run_js_on_loaded_page(webview, script);
    },

    _on_fullscreen_change: function (should_be_fullscreen) {
        // FIXME: Find better way to reference modules within a template
        this.view.article_page._top_left.visible = !should_be_fullscreen;
        this.view.article_page.search_box.visible = !should_be_fullscreen;
        this.view.article_page.xscale = should_be_fullscreen ? 1.0 : this.HORIZONTAL_SPACE_FILL_RATIO;
    },

    _on_key_press_event: function (widget, event) {
        let keyval = event.get_keyval()[1];
        let state = event.get_state()[1];

        if (keyval === Gdk.KEY_Escape) {
            if (this._search_bar !== undefined) {
                this._search_bar.close();
            }
        } else if (((state & Gdk.ModifierType.CONTROL_MASK) !== 0) &&
                    keyval === Gdk.KEY_f) {
            if (this._search_bar === undefined &&
                this.view.get_visible_page() === this.view.lightbox) {
                this._search_bar = new InArticleSearch.InArticleSearch(this.view.article_page.content_module.content_view);
                this.view.article_page.attach(this._search_bar, 0, 3, 2, 1);
            }

            this._search_bar.open();
        }
    },

    // first, if the webview isn't loading something, attempt to run the
    // javascript on the page. Also attach a handler to run the javascript
    // whenever the webview's load-changed indicates it's finished loading
    // something
    _run_js_on_loaded_page: function (webview, script) {
        if (webview.uri !== null && !webview.is_loading) {
            webview.run_javascript(script, null, null);
        }
        let handler = webview.connect('load-changed', (webview, status) => {
            if (status === WebKit2.LoadEvent.FINISHED) {
                webview.run_javascript(script, null, null);
                webview.disconnect(handler);
            }
        });
    },

    _article_render_callback: function (article) {
        return this._renderer.render(article, {
            show_title: true,
        });
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
        case ARTICLE_PAGE:
            this._current_article = item.model;
            this._load_article_in_view(item.model);
            dispatcher.dispatch({
                action_type: Actions.SHOW_ARTICLE,
                model: item.model,
            });
            return;
        case SEARCH_RESULTS_PAGE:
            this._do_search_in_view(item);
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
                return;
            }

            this.load_model(model);
        });
    },

    load_model: function (model) {
        if (model instanceof ArticleObjectModel.ArticleObjectModel) {
            this._history_presenter.set_current_item_from_props({
                page_type: ARTICLE_PAGE,
                model: model,
            });
        } else if (model instanceof MediaObjectModel.MediaObjectModel) {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SHOW_MEDIA,
                model: model,
            });
        }
    },

    // Should be mocked out during tests so that we don't actually send metrics
    record_search_metric: function (query) {
        let recorder = EosMetrics.EventRecorder.get_default();
        recorder.record_event(SEARCH_METRIC, new GLib.Variant('(ss)',
            [query, this.application.application_id]));
    },

    do_search: function (query) {
        let sanitized_query = Utils.sanitize_query(query);
        if (sanitized_query.length === 0)
            return;

        this.record_search_metric(query);
        this._history_presenter.set_current_item_from_props({
            page_type: SEARCH_RESULTS_PAGE,
            query: sanitized_query,
        });
    },
});
