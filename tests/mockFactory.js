const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const MockFactory = new Lang.Class({
    Name: 'MockFactory',
    Extends: GObject.Object,

    _init: function (props={}) {
        this.parent(props);
        this._mock_classes = {};
    },

    create_named_module: function (name, props) {
        if (this._mock_classes.hasOwnProperty(name))
            return new this._mock_classes[name](props);
        return new Gtk.Label();
    },

    add_named_mock: function (name, klass) {
        this._mock_classes[name] = klass;
    },
});
