const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

// Placeholder class that contains all signals and 
// functions for homepage tests,
const MockPlaceholder = new Lang.Class({
    Name: 'Placeholder',
    Extends: Gtk.Label,
    Signals: {
        'activate': {},
        'text-changed': {},
        'menu-item-selected': {},
    },

    _init: function (props={}) {
        this.parent(props);
    },

    set_menu_items: function () {},
});
