const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Compat = imports.app.compat.compat;
const Engine = imports.search.engine;
const EosKnowledgePrivate = imports.gi.EosKnowledgePrivate;
const Warehouse = imports.app.warehouse;

const ModuleFactory = new Lang.Class({
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
        }
        // After this point, the app.json must be the current version!

        this._anonymous_name_to_description = {};
    },

    _parse_json_property: function (module_class, property_name, json_value) {
        let param_spec = GObject.Object.find_property.call(module_class, property_name);
        if (param_spec === null) {
            logError(new Error('Could not find property for', module_class, 'named', property_name));
            return [false, null];
        }
        if (!EosKnowledgePrivate.param_spec_is_enum(param_spec))
            return [true, json_value];
        let [success, enum_value] = EosKnowledgePrivate.param_spec_enum_value_from_string(param_spec, json_value);
        if (!success) {
            logError(new Error('Could not find enum for', property_name, 'named', json_value));
            return [false, null];
        }
        return [true, enum_value];
    },

    create_named_module: function (name, extra_props={}) {
        let description = this._get_module_description_by_name(name);

        let module_class = this.warehouse.type_to_class(description['type']);
        let module_props = {
            factory: this,
            factory_name: name,
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
        if (parent_module.get_slot_names().indexOf(slot) === -1)
            throw new Error('No slot named ' + slot + ' according to module.get_slot_names.');
        if (slot.indexOf('.') !== -1)
            logError(new Error('Slot names should never contain a "."'));
        let slot_value = this._get_module_description_by_name(parent_module.factory_name)['slots'][slot];
        if (slot_value === null)
            return null;
        if (slot_value === undefined)
            throw new Error('No value in ' + parent_module.factory_name + ' module for slot ' + slot);
        let factory_name = slot_value;
        if (typeof slot_value === 'object')
            factory_name = this._setup_anonymous_module(parent_module.factory_name, slot, slot_value);
        return this.create_named_module(factory_name, extra_props);
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
});
