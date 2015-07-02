const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ImagePreviewer = imports.app.imagePreviewer;
const SearchBox = imports.app.searchBox;

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

        this._logo = new ImagePreviewer.ImagePreviewer({
            margin_bottom: 42,
        });
        this._logo.set_max_percentage(0.5);

        this.search_box = new SearchBox.SearchBox({
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
            let stream = Gio.File.new_for_uri(v).read(null);
            this._logo.set_content(stream);
        }
        this.notify('logo-uri');
    },

    get logo_uri () {
        if (this._logo_uri)
            return this._logo_uri;
        return '';
    },
});
