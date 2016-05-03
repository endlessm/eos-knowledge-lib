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

        this._anonymous_name_to_description = {};

        this._id_to_module = new Map();
        this._id_to_name = new Map();
        this._extract_ids();
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

    create_named_module: function (name, extra_props={}) {
        let description = this._get_module_description_by_name(name);
        let id = ('id' in description) ? description['id'] : '';

        if (id in this._id_to_module)
            return this._id_to_module[id];

        let module_class = this.warehouse.type_to_class(description['type']);
        let module_props = {
            factory: this,
            factory_name: name,
            factory_id: id,
        };

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

        return new module_class(module_props);
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

        let slots = this._get_module_description_by_name(parent_module.factory_name)['slots'];
        if (!slots)
            return null;
        let slot_value = slots[slot];
        if (slot_value === null || slot_value === undefined)
            return null;
        let factory_name = slot_value;
        if (typeof slot_value === 'object')
            factory_name = this._setup_anonymous_module(parent_module.factory_name, slot, slot_value);
        return this.create_named_module(factory_name, extra_props);
    },

    /**
     * Method: get_module_for_reference
     * Returns the module instance specified in the reference slot
     *
     * Returns the module instance specified in the {reference_slot} of the module
     * {parent_module}.
     *
     * Parameters:
     *   parent_module - Module which refers to the module instance
     *   reference_slot - Reference slot which contains the ID of module instance
     */
    get_module_for_reference: function (parent_module, reference_slot) {
        let description = this._get_module_description_by_name(parent_module.factory_name);
        let id = description['references'][reference_slot];
        return this.create_named_module(this._id_to_name[id]);
    },

    /**
     * Method: register_module
     * Maps a module instance to an ID
     *
     * Maps the {module} instance to it's {id}. This information is later used
     * by other modules to reference this specific instance.
     *
     * Parameters:
     *   module - instance of the module
     *   id - ID of the module
     */
    register_module: function (module, id) {
        if (id in this._id_to_name && !(id in this._id_to_module))
            this._id_to_module[id] = module;
    },

    /**
     * Method: _get_module_description_by_name
     * Returns JSON description of module
     *
     * Searches the 'modules' property in the app.json for the {name} key
     * and returns the resulting JSON object.
     */
    _get_module_description_by_name: function (name) {
        let description = this.app_json['modules'][name];
        if (!description)
            description = this._anonymous_name_to_description[name];
        if (!description)
            throw new Error('No description found in app.json for ' + name);

        return description;
    },

    _setup_anonymous_module: function (factory_name, slot, description) {
        let name = factory_name + '.' + slot;
        this._anonymous_name_to_description[name] = description;
        return name;
    },

    _extract_ids: function () {
        let modules = this.app_json['modules'];
        /* build only 1 tree if it's a real app */
        let keys = ('interaction' in modules) ? ['interaction'] : Object.keys(modules);
        keys.forEach((factory_name) => {
            let description = this.app_json['modules'][factory_name];
            this._index_id(factory_name, description, false);
            this._recursive_extract_ids(factory_name, description, false);
        });
    },

    _recursive_extract_ids: function (parent_factory_name, parent_description, parent_is_multi) {
        if (!('slots' in parent_description))
            return;
        Object.keys(parent_description['slots']).forEach((slot_name) => {
            let slot_value = parent_description['slots'][slot_name];
            let factory_name = slot_value;
            /* keep track of whether we are inside or below a multi slot */
            let is_multi = this._is_multi_slot(parent_description, slot_name, parent_is_multi);
            if (typeof slot_value === 'string')
                slot_value = this._get_module_description_by_name(slot_value);
            if (typeof slot_value === 'object')
                factory_name = this._setup_anonymous_module(parent_factory_name, slot_name, slot_value);
            this._index_id(factory_name, slot_value, is_multi);
            this._recursive_extract_ids(factory_name, slot_value, is_multi);
        });
    },

    _index_id: function (factory_name, description, is_multi) {
        if (!('id' in description))
            return
        let id = description['id'];

        /* do not allow ID inside or below multi slots */
        if (is_multi)
            throw new Error('ID ' + id + ' defined in multi slot');

        /* do not allow repeated IDs */
        if (id in this._id_to_name)
            throw new Error('ID ' + id + ' redefined for ' + factory_name);

        this._id_to_name[id] = factory_name;
    },

    _is_multi_slot: function (description, slot_name, is_multi) {
        let module_class = this.warehouse.type_to_class(description['type']);
        return (is_multi || ('multi' in module_class.__slots__[slot_name]));
    },
});
