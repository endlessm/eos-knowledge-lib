const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Warehouse = new Lang.Class({
    Name: 'Warehouse',
    Extends: GObject.Object,
    // ModuleFactory has a 'warehouse' property with an object param spec, so
    // this class is required to extend GObject.Object even though it doesn't
    // use any GObject features.

    _init: function (props={}) {
        this.parent(props);
        this._local_modules = new Map();
    },

    register_class: function (module_name, module_class) {
        this._local_modules.set(module_name, module_class);
    },

    type_to_class: function (module_name) {
        if (this._local_modules.has(module_name))
            return this._local_modules.get(module_name);
        let file_name = module_name.charAt(0).toLowerCase() + module_name.slice(1);
        try {
            return imports.app.modules[file_name][module_name];
        } catch (error if (error.message.startsWith('No JS module'))) {
            throw new Error('Module of type ' + module_name + ' not found in file ' + file_name);
        }
    },
});
