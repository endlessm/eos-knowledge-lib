const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

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
     * Method: pack_module
     * Create and add submodules to module slots
     *
     * Uses factory and app_json to create all the submodules specified in
     * the module's description. It then packs those submodules into their
     * corresponding slots.
     *
     * If you don't want all slots to be filled at construct time (for example,
     * because the slot is a card type that should be created on demand) then
     * you should override <Module.pack_module_for_slot()> in your
     * implementation.
     */
    pack_module: function() {
        let slots = this.get_slot_names();

        slots.forEach((slot) => {
            this.pack_module_for_slot(slot);
        });
    },

    /**
     * Method: pack_module_for_slot
     * Attach a submodule to its correct position
     *
     * Can be overridden in class implementations.
     * The default is to add the submodule as a property to the module, whose
     * name consists of the slot name prefixed with an underscore, and pack the
     * submodule into the module using **Gtk.Container.add()**.
     * You should override this function if you don't want that to happen on
     * construction, or if the submodule needs to be packed another way.
     *
     * Parameters:
     *   slot - the slot for which to create and pack the module (string)
     */
    pack_module_for_slot: function(slot) {
        this['_' + slot] = this.create_submodule(slot);
        this.add(this['_' + slot]);
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
        return this.factory.create_module_for_slot(this.factory_name, slot,
            extra_props);
    },
});
