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
const Launcher = imports.app.launcher;
const LightboxPresenter = imports.app.lightboxPresenter;
const MediaObjectModel = imports.search.mediaObjectModel;
const Previewer = imports.app.widgets.previewer;
const QueryObject = imports.search.queryObject;
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

        this._previewer = new Previewer.Previewer({
            visible: true,
        });
        this.view.lightbox.content_widget = this._previewer;

        // Whenever there's a pending lightbox load, its cancellable will be
        // stored here
        this._cancel_lightbox_load = null;

        this._history = new EosKnowledgePrivate.HistoryModel();
        this._history_presenter = new HistoryPresenter.HistoryPresenter({
            history_model: this._history,
        });
        this._history_presenter.connect('history-item-changed', this._on_history_item_change.bind(this));

        this.view.content_page.search_module.connect('article-selected', (module, model) => {
            this.load_model(model);
        });
        this.view.content_page.connect('link-clicked', (page, uri) => {
            this.load_uri(uri);
        });
        this._lightbox_presenter = new LightboxPresenter.LightboxPresenter({
            engine: this._engine,
            lightbox: this.view.lightbox,
            factory: this.factory,
        });
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
        let search = this.view.content_page.search_module;
        search.start_search(item.query);
        if (this.view.get_visible_page() === this.view.home_page)
            this.view.show_content_page();
        this.view.content_page.show_search();
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
                return;
            }
            if (results.length === 0)
                item.empty = true;
            search.finish_search(results);
        });
    },

    _load_article_in_view: function (article) {
        Dispatcher.get_default().dispatch({
            action_type: Actions.SHOW_ARTICLE,
            model: article,
        });
        if (this.view.get_visible_page() === this.view.home_page)
            this.view.show_content_page();
    },

    _article_render_callback: function (article) {
        return this._renderer.render(article, {
            show_title: true,
        });
    },

    _on_history_item_change: function (presenter, item) {
        Dispatcher.get_default().dispatch({
            action_type: Actions.SET_SEARCH_TEXT,
            text: item.query,
        });
        switch (item.page_type) {
        case ARTICLE_PAGE:
            this._current_article = item.model;
            this._load_article_in_view(item.model);
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
                this.view.content_page.search_module.finish_search_with_error();
                this.view.content_page.show_search();
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
            this._lightbox_presenter.show_media_object(this._current_article, model);
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
