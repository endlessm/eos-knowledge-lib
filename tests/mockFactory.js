/* exported MockFactory */

const Knowledge = imports.app.knowledge;
const Minimal = imports.tests.minimal;
const ModuleFactory = imports.app.moduleFactory;

const MockFactory = new Knowledge.Class({
    Name: 'MockFactory',
    Extends: ModuleFactory.ModuleFactory,

    _init: function (local_modules, tree) {
        this.parent({
            app_json: {
                version: 2,
                root: tree,
            },
        });

        this.warehouse = {
            type_to_class: function (name) {
                let klass = local_modules[name];
                if (!klass)
                    klass = Minimal.MinimalBinModule;
                return klass;
            },
        };

        this._created_mocks = new Map();
    },

    // Augment ModuleFactory's private method with some extra functionality
    _create_module: function (path, description, extra_props={}) {
        let module = this.parent(path, description, extra_props);

        let typename = description['type'];
        if (!this._created_mocks[typename])
            this._created_mocks[typename] = [];

        this._created_mocks[typename].push(module);
        return module;
    },

    get_created_mocks: function (typename) {
        return this._created_mocks[typename];
    },

    get_last_created_mock: function (typename) {
        let mocks = this.get_created_mocks(typename);
        return mocks[mocks.length - 1];
    },
});
