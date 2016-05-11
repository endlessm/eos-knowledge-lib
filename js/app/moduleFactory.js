const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Compat = imports.app.compat.compat;
const Engine = imports.search.engine;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Knowledge = imports.app.knowledge;
const Warehouse = imports.app.warehouse;

/**
 * Class: ModuleFactory
 */
const ModuleFactory = new Knowledge.Class({
    Name: 'ModuleFactory',
    Extends: GObject.Object,
    Properties: {
        /**
         * Property: warehouse
         *
         * The warehouse that holds the paths for creating modules.
         */
        'warehouse': GObject.ParamSpec.object('warehouse', 'Warehouse', 'Warehouse',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        /**
         * Property: version
         * Version of the app.json that powers this factory
         */
        'version': GObject.ParamSpec.uint('version', 'Version',
            'Version of the app.json that powers this factory',
            GObject.ParamFlags.READABLE, 0, 999, 2),
    },

    _init: function (props={}) {
        /**
         * Property: app-json
         *
         * The json object parsed from app.json that contains the app's
         * description.
         */
        Object.defineProperties(this, {
            'app_json': {
                value: props['app_json'] || props['app-json'] || props['appJson'],
                writable: true,
            },
        });
        delete props['app_json'];
        delete props['app-json'];
        delete props['appJson'];

        props.warehouse = props.warehouse || new Warehouse.Warehouse();

        this.parent(props);

        if (!this.app_json.hasOwnProperty('version') || this.app_json.version < 2) {
            // For v1 app.jsons, the categories are stored in the app.json
            // rather than in the database. We create fake objects for them.
            Compat.create_v1_set_models(this.app_json, Engine.get_default());
            this.app_json = Compat.transform_v1_description(this.app_json);
            this._version = 1;
        } else {
            this._version = this.app_json.version;
        }
        // After this point, the app.json must be the current version!

        this._ids = new Set();
        this._id_to_module = new Map();
        this._id_to_pending_callbacks = new Map();
        this._path_to_description = new Map();
        this._extract_ids(this.app_json['modules']['interaction'], false);
    },

    get version() {
        return this._version;
    },

    _parse_json_property: function (module_class, property_name, json_value) {
        let param_spec = GObject.Object.find_property.call(module_class, property_name);
        if (param_spec === null) {
            logError(new Error('Could not find property for ' + module_class + ' named ' + property_name));
            return [false, null];
        }
        if (!EosKnowledgePrivate.param_spec_is_enum(param_spec))
            return [true, json_value];
        let [success, enum_value] = EosKnowledgePrivate.param_spec_enum_value_from_string(param_spec, json_value);
        if (!success) {
            logError(new Error('Could not find enum for ' + property_name + ' named ' + json_value));
            return [false, null];
        }
        return [true, enum_value];
    },

    _create_module: function (path, description, extra_props={}) {
        this._path_to_description.set(path, description);

        let id = ('id' in description) ? description['id'] : null;

        let module_class = this.warehouse.type_to_class(description['type']);
        let module_props = {
            factory: this,
            factory_name: path,
        };
        if (id)
            module_props['factory_id'] = id;

        if (description.hasOwnProperty('properties')) {
            let properties = description['properties'];
            for (let property_name in properties) {
                let [success, value] = this._parse_json_property(module_class, property_name, properties[property_name]);
                if (!success)
                    continue;
                module_props[property_name] = value;
            }
        }
        Lang.copyProperties(extra_props, module_props);

        let module = new module_class(module_props);

        if (id) {
            this._id_to_module.set(id, module);
            this._deliver_module_reference(module);
        }

        return module;
    },

    /**
     * Method: create_module_tree
     * Creates the root of the module tree
     *
     * Creates the root module of the module tree described in app.json.
     * This module is usually the interaction that drives the app.
     *
     * Parameters:
     *   extra_props - Extra construct properties for the module.
     */
    create_module_tree: function (extra_props={}) {
        return this._create_module('root', this.app_json['modules']['interaction'],
            extra_props);
    },

    /**
     * Method: create_module_for_slot
     * Returns module specified in app.json for a slot
     *
     * Searches the app.json for the module meant to fill the slot
     * {slot} of module {parent_module}. Creates and returns this module, or null
     * if the slot was not filled.
     *
     * Parameters:
     *   parent_module - Module for which to create submodule
     *   slot - Slot for which to create module
     *   extra_props - dictionary of construct properties for the submodule
     */
    create_module_for_slot: function (parent_module, slot, extra_props={}) {
        if (!(slot in parent_module.constructor.__slots__))
            throw new Error('No slot named ' + slot +
                '; did you define it in Slots in your Module.Class definition?');

        let slots = this._path_to_description.get(parent_module.factory_name)['slots'];
        if (!slots)
            return null;
        let slot_value = slots[slot];
        if (slot_value === null || slot_value === undefined)
            return null;

        let path = parent_module.factory_name + '.' + slot;
        return this._create_module(path, slot_value, extra_props);
    },

    /**
     * Method: request_module_reference
     * Passes an existing module instance through the callback
     *
     * Passes an existing module instance through the callback if the module
     * instance is available, if is not available, just keeps the callback so
     * it can be called later when the module is created.
     *
     * Parameters:
     *   module - module asking for another module instance
     *   reference_slot - reference slot which contains the id of module instance
     *   callback - function to be called whenever the instance is available
     */
    request_module_reference: function (module, reference_slot, callback) {
        let id = this._get_id_for_reference(module, reference_slot);
        if (id === null) {
            callback(null);
            return;
        }
        if (this._id_to_module.has(id)) {
            callback(this._id_to_module.get(id));
            return;
        }
        if (!this._id_to_pending_callbacks.has(id)) {
            this._id_to_pending_callbacks.set(id, []);
        }
        this._id_to_pending_callbacks.get(id).push(callback);
    },

    _deliver_module_reference: function (module) {
        let id = module.factory_id;
        if (!this._id_to_pending_callbacks.has(id))
            return;
        this._id_to_pending_callbacks.get(id).forEach((callback) => {
            callback(module);
        });
        this._id_to_pending_callbacks.delete(id);
    },

    _get_id_for_reference: function (parent_module, reference_slot) {
        if (!(reference_slot in parent_module.constructor.__references__))
            throw new Error('No referenced slot named ' + reference_slot);
        let description = this._path_to_description.get(parent_module.factory_name);
        if (!(reference_slot in description['references']))
            return null;
        return description['references'][reference_slot];
    },

    _extract_ids: function (parent_description, parent_is_multi) {
        this._check_id(parent_description, parent_is_multi);
        if (!('slots' in parent_description))
            return;

        Object.keys(parent_description['slots']).forEach((slot_name) => {
            let slot_value = parent_description['slots'][slot_name];
            /* keep track of whether is inside or below a multi slot */
            let is_multi = this._is_multi_slot(parent_description, slot_name, parent_is_multi);
            if(!slot_value)
                return;
            if (typeof slot_value === 'string')
                slot_value = this._path_to_description.get(slot_value);

            this._extract_ids(slot_value, is_multi);
        });
    },

    _check_id: function (description, parent_is_multi) {
        if (!('id' in description))
            return;
        let id = description['id'];
        if (parent_is_multi)
            throw new Error('id ' + id + ' defined in a multi slot');
        if (this._ids.has(id))
            throw new Error('id ' + id + ' is not unique');

        this._ids.add(id);
    },

    _is_multi_slot: function (description, slot_name, parent_is_multi) {
        let module_class = this.warehouse.type_to_class(description['type']);
        let slot_props = module_class.__slots__[slot_name];
        return (parent_is_multi || ('multi' in slot_props && slot_props['multi']));
    },
});
