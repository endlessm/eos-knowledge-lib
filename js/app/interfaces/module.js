/* exported Class, Module */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Knowledge = imports.app.knowledge;

/**
 * Class: Class
 * Counterpart to Lang.Class for modules
 *
 * To create a new module, use this metaclass as you would use Lang.Class to
 * create a regular class:
 *
 * > const MyModule = new Module.Class({
 * >     Name: 'MyModule',
 * >     Extends: GObject.Object,
 * > });
 *
 * The <Module.Module> interface is implemented automatically even if you don't
 * specify it, since all modules must implement this interface.
 */
const Class = new Lang.Class({
    Name: 'Class',
    Extends: Knowledge.Class,

    _construct: function (props={}) {
        // Make sure Module is implemented before chaining
        props.Implements = props.Implements || [];
        if (props.Implements.indexOf(Module) === -1)
            props.Implements.unshift(Module);

        return this.parent(props);
    },
});

/**
 * Interface: Module
 */
const Module = new Lang.Interface({
    Name: 'Module',
    Requires: [ GObject.Object ],

    Properties: {
        /**
         * Property: factory
         *
         * The <ModuleFactory> widget that is used to construct and return
         * the module to its parent application. The type of this property
         * is flexible to allow for factory mocking in tests.
         */
        'factory': GObject.ParamSpec.object('factory', 'Factory', 'Factory',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),

        /**
         * Property: factory_name
         *
         * The factory_name is used to identify this module within the app.json. The
         * factory will use the factory_name to  return the appropriate submodules
         * for this module's slots.
         */
        'factory-name': GObject.ParamSpec.string('factory-name', 'Module Name', 'Module Name',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            ''),
    },

    /**
     * Method: get_slot_names
     * List names for slots
     *
     * Returns an array containing the names of slots offered by this module.
     * Should be overridden when appropriate in subclasses.
     */
    get_slot_names: function () {
        return [];
    },

    /**
     * Method: create_submodule
     * Create a new instance of a submodule
     *
     * Creates an instance of a submodule through the factory, optionally adding
     * some construct properties.
     * This doesn't pack the submodule anywhere, just returns it.
     *
     * Properties:
     *   slot - the slot for which to create the module (string)
     *   extra_props - dictionary of construct properties
     */
    create_submodule: function (slot, extra_props={}) {
        return this.factory.create_module_for_slot(this, slot,
            extra_props);
    },
});
