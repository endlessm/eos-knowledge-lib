const Gio = imports.gi.Gio;
const Lang = imports.lang;

const EknApplication = imports.application;
const Presenter = imports.reader.presenter;
const Window = imports.reader.window;

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
        // do nothing yet
    },
});
