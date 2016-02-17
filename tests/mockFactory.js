const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

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

    create_named_module: function (name, props={}) {
        this._created_mocks[name] = this._created_mocks[name] || [];
        let retval = null;
        if (this._mock_classes.hasOwnProperty(name)) {
            // Unlike the real factory, we allow creating things that are not
            // Modules in the mock factory, for convenience
            let Klass = this._mock_classes[name];
            // Lang.Class.implements() only works for GJS-defined classes
            if (typeof Klass.implements !== 'undefined' && Klass.implements(Module.Module)) {
                props.factory = this;
                props.factory_name = name;
            }

            Lang.copyProperties(this._mock_props[name], props);
            retval = new Klass(props);
        }
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

    get_last_created_named_mock: function (name) {
        let mocks = this.get_created_named_mocks(name);
        return mocks[mocks.length - 1];
    },

    create_module_for_slot: function (parent, slot, props={}) {
        if (parent.get_slot_names().indexOf(slot) === -1)
            throw new Error('No slot named ' + slot + ' according to module.get_slot_names.');
        let module_name = this._mock_slots[parent.factory_name][slot];
        if (module_name === null)
            return null;

        Lang.copyProperties(this._mock_props[module_name], props);

        return this.create_named_module(module_name, props);
    },
});
