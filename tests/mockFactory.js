const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Knowledge = imports.app.knowledge;
const Module = imports.app.interfaces.module;

const MockFactory = new Knowledge.Class({
    Name: 'MockFactory',
    Extends: GObject.Object,

    _init: function (props={}) {
        this.parent(props);
        this._mock_classes = {};
        this._created_mocks = {};
        this._mock_slots = {};
        this._mock_props = {};
        this._mock_references = {};
        this._mock_id_to_module = {};
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

    add_named_mock: function (name, klass, slots={}, props={}, references={}) {
        this._mock_classes[name] = klass;
        this._mock_slots[name] = slots;
        this._mock_props[name] = props;
        this._mock_references[name] = references;
    },

    add_reference_mock: function (id, klass) {
        this._mock_id_to_module[id] = new klass();
    },

    get_created_named_mocks: function (name) {
        return this._created_mocks[name] || [];
    },

    get_last_created_named_mock: function (name) {
        let mocks = this.get_created_named_mocks(name);
        return mocks[mocks.length - 1];
    },

    create_module_for_slot: function (parent, slot, props={}) {
        if (!(slot in parent.constructor.__slots__))
            throw new Error('No slot named ' + slot +
                '; did you forget to define it in Slots?');
        let module_name = this._mock_slots[parent.factory_name][slot];
        if (module_name === null)
            return null;

        Lang.copyProperties(this._mock_props[module_name], props);

        return this.create_named_module(module_name, props);
    },

    register_module: function (module, id) {
    },

    get_module_for_reference: function (parent, reference) {
        let id = this._mock_references[parent.factory_name][reference];
        return this._mock_id_to_module[id];
    },
});
