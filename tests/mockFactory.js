const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const MockFactory = new Lang.Class({
    Name: 'MockFactory',
    Extends: GObject.Object,

    _init: function (props={}) {
        this.parent(props);
        this._mock_classes = {};
        this._created_mocks = {};
        this._class_descriptions = {};
    },

    create_named_module: function (name, props) {
        this._created_mocks[name] = this._created_mocks[name] || [];
        if (this._mock_classes.hasOwnProperty(name)) {
            let retval = new this._mock_classes[name](props);
            this._created_mocks[name].push(retval);
            return retval;
        }
        let retval = new Gtk.Label();
        this._created_mocks[name].push(retval);
        return retval;
    },

    add_named_description: function (name, description) {
        this._class_descriptions[name] = description;
    },

    add_named_mock: function (name, klass) {
        this._mock_classes[name] = klass;
    },

    get_created_named_mocks: function (name) {
        return this._created_mocks[name] || [];
    },

    create_module_for_slot: function (parent_name, slot) {
        let module_name = this._mock_slots[parent_name][slot];

        return this.create_named_module(submodule_name, {});
    },
});
