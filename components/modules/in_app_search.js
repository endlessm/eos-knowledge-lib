const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Builder = imports.builder;

const InAppSearch = new Lang.Class({
    Name: 'InAppSearch',
    Extends: Gtk.Frame,
    Signals: {
        'search_activated': {
            param_types: [ GObject.TYPE_STRING ],
        },
    },
    Template: 'resource:///com/endlessm/test/data/in_app_search.ui.xml',
    InternalChildren: [ 'search_box' ],

    _init: function (props) {
        this.parent(props);
        this.init_template();
        this.add(this._search_box);
    },

    on_search_box_activate: function () {
        this.emit('search-activated', this._search_box.text);
    },

    on_search_box_icon_press: function (entry, icon_pos) {
        if (icon_pos === Gtk.EntryIconPosition.PRIMARY)
            this.emit('search-activated', this._search_box.text);
    },
});
Builder.bind_template(InAppSearch.prototype);

function create_me(props) {
    return new InAppSearch(props);
}
