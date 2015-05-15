const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const HomePage = new Lang.Class({
    Name: 'HomePage',
    Extends: Gtk.Grid,
    Properties: {
        /**
         * Property: logo-uri
         * A string with the URI of the logo image. An empty string means
         * no logo should be visible. Defaults to an empty string.
         */
        'logo-uri': GObject.ParamSpec.string('logo-uri', 'Logo URI',
            'URI of the app logo',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),

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
            Endless.SearchBox),
    },

    _init: function(props) {
        props = props || {};
        props.name = 'HomePage';
        props.halign = Gtk.Align.CENTER;
        props.valign = Gtk.Align.CENTER;
        props.orientation = Gtk.Orientation.VERTICAL;
        this.parent(props);

        this._logo_uri = null;

        this._logo = new Gtk.Image({
            margin_bottom: 42,
        });

        this.search_box = new Endless.SearchBox({
            max_width_chars: 52 // set width as per design
        });
        this.search_box.name = 'home-page-search-box';

        this.add(this._logo);
        this.add(this.search_box);

        this.search_box.grab_focus();
    },

    set logo_uri (v) {
        if (this._logo_uri === v) return;
        this._logo_uri = v;
        if (this._logo_uri) {
            this._logo.resource = this.logo_uri;
        }
        this.notify('logo-uri');
    },

    get logo_uri () {
        if (this._logo_uri)
            return this._logo_uri;
        return '';
    },
});
