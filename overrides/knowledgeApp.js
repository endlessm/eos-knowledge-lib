const Gio = imports.gi.Gio;
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
        let app_json_file = this.resource_file.get_child('app.json');
        let presenter = new Presenter.Presenter(this, app_json_file.get_uri());
    }
});
