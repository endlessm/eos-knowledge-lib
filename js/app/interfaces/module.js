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
    },

    /**
     * Method: pack_module
     * Create and add submodules to module slots.
     *
     * Uses factory and app_json to create all the submodules specificed in
     * the module's description. It then packs those submodules into their
     * corresponding slots.
     */
    pack_module: function () {
        let module_name = this.factory.class_name_to_module_name(this.__name__);
        let description = this.factory.get_module_description_by_name(module_name);
        let slots = this.get_slot_names();

        slots.forEach((slot) => {
            let submodule_name = description['submodules'][slot];
            if (submodule_name !== undefined) {
                let submodule = this.factory.create_named_module(submodule_name);
                this["_" + slot].add(submodule);
            }
        });
    },

    /**
     * Method: get_slot_names
     * List names for slots.
     *
     * Returns an array containing the names of slots offered by this module.
     * Should be overridden when appropriate in subclasses.
     */
    get_slot_names: function () {
        return [];
    },
});
