// Copyright 2015 Endless Mobile, Inc.

const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const EosMetrics = imports.gi.EosMetrics;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Actions = imports.app.actions;
const ArticleHTMLRenderer = imports.app.articleHTMLRenderer;
const ArticleObjectModel = imports.search.articleObjectModel;
const Dispatcher = imports.app.dispatcher;
const Engine = imports.search.engine;
const HistoryPresenter = imports.app.historyPresenter;
const Interaction = imports.app.interfaces.interaction;
const Launcher = imports.app.launcher;
const MediaObjectModel = imports.search.mediaObjectModel;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;
const WebkitContextSetup = imports.app.webkitContextSetup;

/**
 * Class: MeshInteraction
 *
 * The Mesh interaction model controls the Encyclopedia and presets formerly
 * known as templates A and B.
 * A very exploratory interaction, the content is organized into categories and
 * may have filters, but can be reached through many different paths.
 */
const MeshInteraction = new Lang.Class({
    Name: 'MeshInteraction',
    GTypeName: 'EknMeshInteraction',
    Extends: GObject.Object,
    Implements: [ Module.Module, Launcher.Launcher, Interaction.Interaction ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'application': GObject.ParamSpec.override('application', Interaction.Interaction),
        'engine': GObject.ParamSpec.override('engine', Interaction.Interaction),
        'view': GObject.ParamSpec.override('view', Interaction.Interaction),
        'template-type': GObject.ParamSpec.override('template-type', Interaction.Interaction),
        'css': GObject.ParamSpec.override('css', Interaction.Interaction),
    },

    ARTICLE_PAGE: 'article',
    HOME_PAGE: 'home',
    SEARCH_PAGE: 'search',
    SECTION_PAGE: 'section',

    SEARCH_METRIC: 'a628c936-5d87-434a-a57a-015a0f223838',

    _init: function (props) {
        // Needs to happen before before any webviews are created
        WebkitContextSetup.register_webkit_extensions(props.application.application_id);
        WebkitContextSetup.register_webkit_uri_handlers(this._article_render_callback.bind(this));

        props.engine = props.engine || Engine.Engine.get_default();

        props.view = props.view || props.factory.create_named_module('window', {
            application: props.application,
            template_type: props.template_type,
        });

        this.parent(props);

        this.history_presenter = new HistoryPresenter.HistoryPresenter({
            history_model: new EosKnowledgePrivate.HistoryModel(),
        });

        this._renderer = new ArticleHTMLRenderer.ArticleHTMLRenderer();
    },

    _article_render_callback: function (article_model) {
        return this._renderer.render(article_model, {
            enable_scroll_manager: this.template_type === 'A',
            show_title: this.template_type !== 'A',
        });
    },

    do_search: function (query) {
        let sanitized_query = Utils.sanitize_query(query);
        if (sanitized_query.length === 0)
            return;

        this.record_search_metric(query);
        this.history_presenter.set_current_item_from_props({
            page_type: this.SEARCH_PAGE,
            query: sanitized_query,
        });
    },

    // Should be mocked out during tests so that we don't actually send metrics
    record_search_metric: function (query) {
        let recorder = EosMetrics.EventRecorder.get_default();
        recorder.record_event(this.SEARCH_METRIC, new GLib.Variant('(ss)',
            [query, this.application.application_id]));
    },

    // Launcher implementation
    desktop_launch: function (timestamp) {
        if (timestamp)
            this.view.present_with_time(timestamp);
        else
            this.view.present();
    },

    // Launcher implementation
    search: function (timestamp, query) {
        this.do_search(query);
        this.desktop_launch(timestamp);
    },

    // Launcher implementation
    activate_search_result: function (timestamp, ekn_id, query) {
        this.load_uri(ekn_id, false);
        this.desktop_launch(timestamp);
    },

    load_uri: function (ekn_id, load_model) {
        this.engine.get_object_by_id(ekn_id, null, (engine, task) => {
            let model;
            try {
                model = engine.get_object_by_id_finish(task);
            } catch (error) {
                logError(error);
                if (this.template_type === 'encyclopedia') {
                    this.view.content_page.search_module.finish_search_with_error();
                    this.view.content_page.show_search();
                }
                return;
            }

            if (load_model)
                this.load_model(model);
        });
    },

    load_model: function (model) {
        if (model instanceof ArticleObjectModel.ArticleObjectModel) {
            this.history_presenter.set_current_item_from_props({
                page_type: this.ARTICLE_PAGE,
                model: model,
            });
        } else if (model instanceof MediaObjectModel.MediaObjectModel) {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SHOW_MEDIA,
                model: model,
            });
        }
     },
});
