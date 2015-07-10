const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const SearchBox = imports.app.searchBox;

const HomePage = new Lang.Class({
    Name: 'HomePage',
    Extends: Gtk.Grid,
    Properties: {
        /**
         * Property: factory
         * Factory to create modules
         */
        'factory': GObject.ParamSpec.object('factory', 'Factory', 'Factory',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),

        /**
         * Property: search-box
         *
         * The <SearchBox> widget created by this widget. Read-only,
         * modify using the <SearchBox> API. Use to type search queries and to display the last
         * query searched.
         */
        'search-box': GObject.ParamSpec.object('search-box', 'Search Box',
            'The seach box for this view.',
            GObject.ParamFlags.READABLE,
            SearchBox.SearchBox),
    },

    _init: function(props) {
        props = props || {};
        props.name = 'HomePage';
        props.halign = Gtk.Align.CENTER;
        props.valign = Gtk.Align.CENTER;
        props.orientation = Gtk.Orientation.VERTICAL;
        this.parent(props);

        this._logo_uri = null;

        this._logo = this.factory.create_named_module('app-banner');

        this.search_box = new SearchBox.SearchBox({
            max_width_chars: 52 // set width as per design
        });
        this.search_box.name = 'home-page-search-box';

        this.add(this._logo);
        this.add(this.search_box);

        this.search_box.grab_focus();
    },
});
