const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Builder = imports.builder;

const InAppSearch = new Lang.Class({
    Name: 'InAppSearch',
    Extends: Gtk.Frame,
    Template: 'resource:///com/endlessm/test/data/in_app_search.ui.xml',
    InternalChildren: [ 'search_box' ],

    _init: function (props) {
        this.parent(props);
        this.init_template();
        this.add(this._search_box);
    },
});
Builder.bind_template(InAppSearch.prototype);

function create_me(props) {
    return new InAppSearch(props);
}
