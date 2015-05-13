const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Template = new Lang.Class({
    Name: 'Template',
    Extends: Gtk.Frame, // This is an interface so it shouldn't extend anything
    // But we can stick widgets inside here and stick this inside another widget
    // so Gtk.Frame should do for now.

    MODULE_TYPES: [],

    _init: function (props) {
        this.parent(props);
        this._modules = {};
    },

    add_module: function (type, widget) {
        if (this.MODULE_TYPES.indexOf(type) === -1)
            throw new Error("This template doesn't support that type of module: " + type);

        if (type in this._modules)
            this.remove(this._modules[type]);
        this._modules[type] = widget;

        // To be overridden; widget is actually packed in template's override
    },
});
