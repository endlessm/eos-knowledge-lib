// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

/**
 * Class: HomePage
 *
 * This represents the home page for template A of the knowledge apps.
 * It has a title, subtitle, and list of article cards to show
 *
 */
const HomePageA = new Lang.Class({
    Name: 'HomePageA',
    GTypeName: 'EknHomePageA',
    Extends: Gtk.Grid,
    Properties: {
        /**
         * Property: title
         * A string with the title of the home page. Defaults to an empty string.
         */
        'title': GObject.ParamSpec.string('title', 'Page Title',
            'Title of the page',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
        /**
         * Property: subtitle
         * A string with the subtitle of the home page. Defaults to an empty string.
         */
        'subtitle': GObject.ParamSpec.string('subtitle', 'Page Subtitle',
            'Subtitle of the page',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, '')

        /**
         * Property: cards
         * A list of Card objects representing the cards to be displayed on this page.
         * It is set as a normal javascript object since GJS does not support setting
         * objects using ParamSpec.
         */
    },
    Signals: {
        /**
         * Event: search-entered
         * This event is triggered when the search box is activated. The parameter
         * is the search query.
         */
        'search-entered': {
            param_types: [GObject.TYPE_STRING]
        }
    },

    _init: function (props) {
        props = props || {};
        this._title_label = new Gtk.Label();
        this._subtitle_label = new Gtk.Label();
        this._background_provider = new Gtk.CssProvider();

        this._cards = null;
        this._title = null;
        this._subtitle = null;

        props.orientation = Gtk.Orientation.VERTICAL;

        this._card_grid = new Gtk.Grid({
            margin_bottom: 30,
            halign: Gtk.Align.CENTER
        });

        // Not using a SearchEntry since that comes with
        // the 'x' as secondary icon, which we don't want
        this._search_box = new Gtk.Entry({
            margin_top: 30,
            primary_icon_name: 'edit-find-symbolic'
        });

        this._search_box.connect('activate', Lang.bind(this, this._on_search_entered));

        this.parent(props);

        let grid = new Gtk.Grid({
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
            expand: true,
            orientation: Gtk.Orientation.VERTICAL
        });

        grid.attach(this._title_label, 0, 0, 3, 1);

        let left_line = new Gtk.Separator();
        let right_line = new Gtk.Separator();

        grid.attach(left_line, 0, 1, 1, 1);
        grid.attach(this._subtitle_label, 1, 1, 1, 1);
        grid.attach(right_line, 2, 1, 1, 1);
        grid.attach(this._search_box, 0, 2, 3, 1);


        this.add(grid);
        this.add(this._card_grid)
        this.show_all();
    },

    set title (v) {
        if (this._title === v) return;
        this._title = v;
        this._title_label.label = this._title.toUpperCase();
        this.notify('title');
    },

    get title () {
        if (this._title)
            return this._title;
        return '';
    },

    set subtitle (v) {
        if (this._subtitle === v) return;
        this._subtitle = v;
        this._subtitle_label.label = this._subtitle;
        this.notify('subtitle');
    },

    get subtitle () {
        if (this._subtitle)
            return this._subtitle;
        return '';
    },

    set cards (v) {
        if (this._cards === v)
            return;
        if (this._cards !== null){
            for (let card of this._cards) {
                this._card_grid.remove(card);
            }
        }

        this._cards = v;
        if (this._cards !== null){
            for (let card of this._cards) {
                card.margin_left = 20;
                card.margin_right = 20;
                card.halign = Gtk.Align.CENTER;
                this._card_grid.add(card);
            }
        }
    },

    get cards () {
        return this._cards;
    },

    _on_search_entered: function (widget) {
        this.emit('search-entered', widget.text);
    },

});
