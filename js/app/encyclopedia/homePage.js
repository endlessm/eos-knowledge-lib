const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Layout = imports.app.encyclopedia.layoutPage;

const HomePage = new Lang.Class({
    Name: 'HomePage',
    Extends: Layout.EncyclopediaLayoutPage,

    _init: function(props) {
        props = props || {};
        props.name = 'HomePage';
        this.parent(props);

        this._box = new Gtk.Grid({
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
            orientation: Gtk.Orientation.VERTICAL
        });

        this._logo = new Gtk.Image({
            resource: this._logo_resource,
            margin_bottom: 42,
        });

        this.search_box = new Endless.SearchBox({
            max_width_chars: 52 // set width as per design
        });
        this.search_box.name = 'home-page-search-box';
        this.search_box.placeholder_text = this.SEARCH_BOX_PLACEHOLDER_TEXT;

        this._box.add(this._logo);
        this._box.add(this.search_box);

        // The aligment allows Gtk.Overlay to take the whole window allocation
        let alignment = new Gtk.Alignment();
        alignment.add(this._box);
        this.add(alignment);
        this.add_overlay(this._disclaimer_icon);
        this.search_box.grab_focus();
    }
});
