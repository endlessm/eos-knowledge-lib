/* exported MockFactory, setup_tree */

const GObject = imports.gi.GObject;

const Knowledge = imports.framework.knowledge;
const Minimal = imports.tests.minimal;
const ModuleFactory = imports.framework.moduleFactory;

const _MockWarehouse = new Knowledge.Class({
    Name: 'MockWarehouse',
    GTypeName: 'mockFactory_MockWarehouse',
    Extends: GObject.Object,
    // ModuleFactory has a 'warehouse' property with an object param spec, so
    // this class is required to extend GObject.Object even though it doesn't
    // use any GObject features.

    // This warehouse doesn't take strings; instead, you pass the constructor
    // in directly. If null, you get a minimal module
    type_to_class: klass => klass || Minimal.MinimalBinModule,
});

/**
 * Class: MockFactory
 * Import and build modules from your local tree for tests only
 *
 * This class should be used instead of ModuleFactory for unit tests.
 * Its constructor takes a module tree, such as what you would specify as the
 * "root" key in an app.json file, with two differences.
 * First, the "type" keys take actual class objects rather than strings, so you
 * must import your modules and pass them to the factory in this way.
 * Second, the "type" key's value may be null, in which case a minimal module
 * will be put into that slot.
 */
const MockFactory = new Knowledge.Class({
    Name: 'MockFactory',
    Extends: ModuleFactory.ModuleFactory,

    _init: function (tree) {
        if (typeof tree !== 'object')
            throw new Error("You must provide a valid tree object to the Mock Factory");
        this.parent({
            app_json: {
                version: 2,
                root: tree,
            },
            warehouse: new _MockWarehouse(),
        });
        this._created_modules = new Map();
    },

    // Augment ModuleFactory's private method with some extra functionality
    _create_module: function (path, description, extra_props={}) {
        let module = this.parent(path, description, extra_props);

        let key = path.replace(/\.[0-9]+/, '', 'g').replace(/^root\./, '');
        if (!this._created_modules.has(key))
            this._created_modules.set(key, []);

        this._created_modules.get(key).push(module);
        return module;
    },

    get_created: function (path) {
        return this._created_modules.get(path) || [];
    },

    get_last_created: function (path) {
        let mocks = this.get_created(path);
        return mocks[mocks.length - 1];
    },
});

/**
 * Function: setup_tree
 * Convenience function for creating a MockFactory with module tree
 */
function setup_tree(tree, extra_props={}) {
    let factory = new MockFactory(tree);
    return [factory.create_root_module(extra_props), factory];
}
