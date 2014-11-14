const Gio = imports.gi.Gio;
const Lang = imports.lang;

const EknApplication = imports.application;
const Presenter = imports.reader.presenter;

/**
 * Class: Reader.Application
 * Application class for reader apps
 *
 * Starts an app with a <Reader.Window> and <Reader.Presenter>, and loads a CSS
 * stylesheet from resource:///com/endlessm/knowledge/endless_reader.css.
 *
 * Parent class:
 *   <Application>
 */
const Application = new Lang.Class({
    Name: 'Application',
    GTypeName: 'EknReaderApplication',
    Extends: EknApplication.Application,

    _init: function (props) {
        props = props || {};
        props.css_file = Gio.File.new_for_uri('resource:///com/endlessm/knowledge/endless_reader.css');
        this.parent(props);
    },

    vfunc_startup: function () {
        this.parent();

        let app_json_file = this.resource_file.get_child('app.json');
        let presenter = new Presenter.Presenter({
            application: this,
            app_file: app_json_file,
        });
    },
});
