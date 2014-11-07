const Gio = imports.gi.Gio;
const Gdk = imports.gi.Gdk;
const Lang = imports.lang;
const System = imports.system;

const ArticlePresenter = imports.articlePresenter;
const EknApplication = imports.application;
const Engine = imports.engine;
const Presenter = imports.presenter;
const Window = imports.window;
const Utils = imports.utils;

const KnowledgeApp = new Lang.Class ({
    Name: 'KnowledgeApp',
    GTypeName: 'EknKnowledgeApp',
    Extends: EknApplication.Application,

    _init: function (props) {
        props = props || {};
        props.css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_knowledge.css');
        this.parent(props);
    },

    vfunc_startup: function() {
        this.parent();

        this.search_provider.connect('load-page', function (launcher, model, query, timestamp) {
            this._activation_timestamp = timestamp;
            this.activate();
            let results = this.search_provider.get_results();
            let more_results_callback = this.search_provider.get_more_results_callback();
            this._presenter.on_search_result_activated(model, query, results, more_results_callback);
        }.bind(this));

        this.search_provider.connect('load-query', function (launcher, query, timestamp) {
            this._activation_timestamp = timestamp;
            this.activate();
            this._presenter._on_search(this._presenter.view, query);
        }.bind(this));
    },

    vfunc_activate: function () {
        this.parent();
        if (!this._presenter) {
            let app_json_file = this.resource_file.get_child('app.json');
            let app_content = Utils.parse_object_from_file(app_json_file);
            let domain = app_content['appId'].split('.').pop();
            let template_type = app_content['templateType'];

            let view = new Window.Window({
                application: this,
                template_type: template_type,
                title: app_content['appTitle'],
            });

            view.home_page.title_image_uri = app_content['titleImageURI'];
            view.background_image_uri = app_content['backgroundHomeURI'];
            view.blur_background_image_uri = app_content['backgroundSectionURI'];

            let engine = new Engine.Engine();

            let article_presenter = new ArticlePresenter.ArticlePresenter({
                article_view: view.article_page,
                engine: engine,
                template_type: template_type,
            });

            this._presenter = new Presenter.Presenter({
                article_presenter: article_presenter,
                domain: domain,
                engine: engine,
                template_type: template_type,
                view: view,
            });
            this._presenter.set_sections(app_content['sections']);
        }

        this._presenter.view.show_all();
        this._presenter.view.present_with_time(this._activation_timestamp);
        this._activation_timestamp = Gdk.CURRENT_TIME;
    },

    vfunc_window_removed: function(win) {
        if (this._presenter.view == win) {
            this._presenter = null;
        }

        this.parent(win);
    }
});
