const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Warehouse = new Lang.Class({
    Name: 'Warehouse',
    Extends: GObject.Object,

    _init: function (props={}) {
        this.parent();
    },

    type_to_class: function (module_name) {
        let file_name = module_name.charAt(0).toLowerCase() + module_name.slice(1);
        try {
            return imports.app.modules[file_name][module_name];
        } catch (error if (error.message.startsWith('No JS module'))) {
            throw new Error('Module of type ' + module_name + ' not found in file ' + file_name);
        }
    },
});
