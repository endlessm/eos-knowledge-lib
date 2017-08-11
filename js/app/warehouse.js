const GObject = imports.gi.GObject;

const Knowledge = imports.app.knowledge;

var Warehouse = new Knowledge.Class({
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

        try {
            return module_name.split('.').reduce((current_dir, module_path, idx, arr) => {
                let file_name = module_path.charAt(0).toLowerCase() + module_path.slice(1);
                // If it's the last member of the path, then we need to add the module name to
                // reference the actual class we want to retrieve.
                // e.g. Card.Media --> card.media.Media
                if (idx === arr.length - 1) {
                    return current_dir[file_name][module_path];
                }
                return current_dir[file_name];
            }, imports.app.modules);
        } catch (error if (error.message.startsWith('No JS module'))) {
            let path_name = module_name.split('.').map((name) => name.charAt(0).toLowerCase() + name.slice(1)).join('/');
            throw new Error('Module of type ' + module_name + ' not found in file ' + path_name);
        }
    },
});
