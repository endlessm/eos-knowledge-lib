const GObject = imports.gi.GObject;
const Lang = imports.lang;

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
        this.parent(props);
    },

    create_named_module: function (name, extra_props={}) {
        let description = this.app_json['modules'][name];
        if (!description)
            throw new Error('No description found in app.json for ' + name);

        let module_class = this.warehouse.type_to_class(description['type']);
        let module_props = {
            factory: this,
        };

        if (description.hasOwnProperty('properties'))
            Lang.copyProperties(description['properties'], module_props);
        Lang.copyProperties(extra_props, module_props);

        return new module_class(module_props);
    },
});
