const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Compat = imports.app.compat.compat;
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

        if (!this.app_json.hasOwnProperty('version') || this.app_json.version < 2)
            this.app_json = Compat.transform_v1_description(this.app_json);
        // After this point, the app.json must be the current version!
    },

    create_named_module: function (name, extra_props={}) {
        let description = this.get_module_description_by_name(name);

        let module_class = this.warehouse.type_to_class(description['type']);
        let module_props = {
            factory: this,
        };

        if (description.hasOwnProperty('properties'))
            Lang.copyProperties(description['properties'], module_props);
        Lang.copyProperties(extra_props, module_props);

        return new module_class(module_props);
    },

    /**
     * Method: get_module_description_by_name
     * Returns JSON description of module.
     *
     * Searches the 'modules' property in the app.json for the {name} key
     * and returns the resulting JSON object.
     */
    get_module_description_by_name: function (name) {
        let description = this.app_json['modules'][name];
        if (!description)
            throw new Error('No description found in app.json for ' + name);

        return description;
    },

    /**
     * Method: class_name_to_module_name
     * Converts a ClassName to a module-name.
     *
     * Module names are used as the keys in the app.json and so are required to
     * get a class's JSON description from the factory.
     */
    class_name_to_module_name: function (klass) {
        return klass[0].toLowerCase() + klass.slice(1).replace(/[A-Z]/g, (letter) => {
            return "-" + letter.toLowerCase();
        });
    },
});
