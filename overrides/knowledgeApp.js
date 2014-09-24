const Gio = imports.gi.Gio;
const Gdk = imports.gi.Gdk;
const Lang = imports.lang;

const EknApplication = imports.application;
const Presenter = imports.presenter;
const SearchProvider = imports.searchProvider.SearchProvider;

const KnowledgeApp = new Lang.Class ({
    Name: 'KnowledgeApp',
    GTypeName: 'EknKnowledgeApp',
    Extends: EknApplication.Application,

    _init: function (props) {
        props = props || {};
        props.css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_knowledge.css');
        this.parent(props);

        this.search_provider = new SearchProvider();
    },

    vfunc_startup: function() {
        this.parent();

        this.search_provider.connect('load-page', function (launcher, model, query, timestamp) {
            this._activation_timestamp = timestamp;
            this.activate();
            this._presenter.on_search_result_activated(model, query);
        }.bind(this));

        this.search_provider.connect('load-query', function (launcher, query, timestamp) {
            this._activation_timestamp = timestamp;
            this.activate();
            this._presenter._on_search(this._presenter.view, query);
        }.bind(this));
    },

    vfunc_dbus_register: function(connection, path) {
        this.parent(connection, path);
        this.search_provider.export(connection, path);
        return true;
    },

    vfunc_dbus_unregister: function(connection, path) {
        this.parent(connection, path);
        this.search_provider.unexport(connection, path);
    },

    vfunc_activate: function () {
        this.parent();
        if (!this._presenter) {
            let app_json_file = this.resource_file.get_child('app.json');
            this._presenter = new Presenter.Presenter(this, app_json_file.get_uri());
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
