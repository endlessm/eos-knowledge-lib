const GObject = imports.gi.GObject;

const Knowledge = imports.framework.knowledge;

var Warehouse = new Knowledge.Class({
    Name: 'Warehouse',
    Extends: GObject.Object,
    // ModuleFactory has a 'warehouse' property with an object param spec, so
    // this class is required to extend GObject.Object even though it doesn't
    // use any GObject features.

    _init(props={}) {
        this.parent(props);
        this._local_modules = new Map();
        this._importer = imports.framework.modules;
        this._custom_importer = imports['.'];
        this._custom_importer.searchPath = ['resource:///app/js'];
    },

    register_class(module_name, module_class) {
        this._local_modules.set(module_name, module_class);
    },

    _load_module(module_name, importer) {
        try {
            return module_name.split('.').reduce((current_dir, module_path, idx, arr) => {
                let file_name = module_path.charAt(0).toLowerCase() + module_path.slice(1);
                // If it's the last member of the path, then we need to add the module name to
                // reference the actual class we want to retrieve.
                // e.g. View.Media --> view.media.Media
                if (idx === arr.length - 1) {
                    return current_dir[file_name][module_path];
                }
                return current_dir[file_name];
            }, importer);
        } catch (error) {
            if (error.message.startsWith('No JS module'))
                return null;
            throw error;
        }
    },

    type_to_class(module_name) {
        if (this._local_modules.has(module_name))
            return this._local_modules.get(module_name);

        let module_class = this._load_module(module_name, this._importer);
        if (module_class)
            return module_class;

        // Make the custom importer temporarily available
        // so it can be accessed by custom modules as well.
        window.custom_modules = this._custom_importer;
        module_class = this._load_module(module_name, this._custom_importer);
        delete window.custom_modules;
        if (module_class)
            return module_class;

        let path_name = module_name.split('.').map((name) => name.charAt(0).toLowerCase() + name.slice(1)).join('/');
        throw new Error('Module of type ' + module_name + ' not found in file ' + path_name);
    },
});
