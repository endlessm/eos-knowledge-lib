const Gio = imports.gi.Gio;
const Gdk = imports.gi.Gdk;
const Lang = imports.lang;

const EknApplication = imports.application;
const Presenter = imports.presenter;

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
            this._presenter = new Presenter.Presenter({
                application: this,
                app_file: app_json_file,
            });
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
