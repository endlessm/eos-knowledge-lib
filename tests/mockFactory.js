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
        this._mock_slots = {};
        this._mock_props = {};
    },

    create_named_module: function (name, props) {
        this._created_mocks[name] = this._created_mocks[name] || [];
        if (this._mock_classes.hasOwnProperty(name)) {
            Lang.copyProperties(this._mock_props[name], props);
            let retval = new this._mock_classes[name](props);
            this._created_mocks[name].push(retval);
            return retval;
        }
        let retval = new Gtk.Label();
        this._created_mocks[name].push(retval);
        return retval;
    },

    add_named_mock: function (name, klass, slots={}, props={}) {
        this._mock_classes[name] = klass;
        this._mock_slots[name] = slots;
        this._mock_props[name] = props;
    },

    get_created_named_mocks: function (name) {
        return this._created_mocks[name] || [];
    },

    create_module_for_slot: function (parent, slot, props={}) {
        if (parent.get_slot_names().indexOf(slot) === -1)
            throw new Error('No slot named ' + slot + ' according to module.get_slot_names.');
        let module_name = this._mock_slots[parent.factory_name][slot];

        return this.create_named_module(module_name, props);
    },
});
