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
});
