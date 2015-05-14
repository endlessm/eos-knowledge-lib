const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Template = imports.interfaces.template;

const HomePage = new Lang.Class({
    Name: 'HomePage',
    Extends: Template.Template, // This is an interface so it shouldn't extend anything
    Signals: {
        'search-activated': {
            param_types: [ GObject.TYPE_STRING ],
        },
    },

    MODULE_TYPES: ['app_banner', 'in_app_search', 'bag_o_cards'],

    _init: function (props) {
        this.parent(props);
    },

    clear_search_box: function () {
        if (!('in_app_search' in this._modules))
            return;
        this._modules['in_app_search'].clear_search_box();
    },
});
