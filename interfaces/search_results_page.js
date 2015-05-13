const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Template = imports.interfaces.template;

const SearchResultsPage = new Lang.Class({
    Name: 'SearchResultsPage',
    Extends: Template.Template, // This is an interface so it shouldn't extend anything

    MODULE_TYPES: ['app_banner', 'in_app_search', 'bag_o_cards'],

    _init: function (props) {
        this.parent(props);
    },
});
