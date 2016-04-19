const Gtk = imports.gi.Gtk;

const Knowledge = imports.app.knowledge;

// Placeholder class that contains all signals and 
// functions for homepage tests,
const MockPlaceholder = new Knowledge.Class({
    Name: 'Placeholder',
    Extends: Gtk.Label,
    Signals: {
        'activate': {},
        'text-changed': {},
        'menu-item-selected': {},
    },

    set_menu_items: function () {},
});
