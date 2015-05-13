const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Builder = imports.builder;
const HomePage = imports.interfaces.home_page;

const EbiHome = new Lang.Class({
    Name: 'EbiHome',
    Extends: HomePage.HomePage,
    Template: 'resource:///com/endlessm/test/data/ebi_home.ui.xml',
    InternalChildren: [ 'grid' ],

    _init: function (props={}) {
        this.parent(props);
        this.init_template();
        this.add(this._grid);
    },
});
Builder.bind_template(EbiHome.prototype);

function create_me(props) {
    return new EbiHome(props);
}
