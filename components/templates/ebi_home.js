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

    add_module: function (type, widget) {
        this.parent(type, widget);

        // Is this the best place to set these properties? The template controls
        // how the modules are arranged within the page.
        widget.hexpand = true;
        widget.valign = Gtk.Align.CENTER;
        widget.halign = Gtk.Align.CENTER;
        widget.margin_top = 30;

        switch (type) {
            case 'app_banner':
                this._grid.attach(widget, 0, 0, 1, 1);
                break;
            case 'in_app_search':
                this._grid.attach(widget, 0, 1, 1, 1);
                widget.connect('search-activated', (module, text) =>
                    this.emit('search-activated', text));
                break;
        }
    }
});
Builder.bind_template(EbiHome.prototype);

function create_me(props) {
    return new EbiHome(props);
}
