// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: HomePage
 *
 * This represents the abstract class for the home page of the knowledge apps.
 * It has a title, subtitle, and list of article cards to show.
 * To work properly, subclasses must implement the 'get card' and 'set card' methods.
 *
 */
const HomePage = new Lang.Class({
    Name: 'HomePage',
    GTypeName: 'EknHomePage',
    Extends: Gtk.Grid,
    Properties: {
        /**
         * Property: title
         * A string with the title of the home page. Defaults to an empty string.
         */
        'title': GObject.ParamSpec.string('title', 'Page Title',
            'Title of the page',
            GObject.ParamFlags.READWRITE, ''),
        /**
         * Property: subtitle
         * A string with the subtitle of the home page. Defaults to an empty string.
         */
        'subtitle': GObject.ParamSpec.string('subtitle', 'Page Subtitle',
            'Subtitle of the page',
            GObject.ParamFlags.READWRITE, ''),
        /**
         * Property: has-search-box
         * True if the home page should have a search box.
         */
        'has-search-box':  GObject.ParamSpec.boolean('has-search-box', 'Has Search Box',
            'True if the home page should have a search box. Default is true',
            GObject.ParamFlags.READWRITE, true)

        /**
         * Property: cards
         * A list of Card objects representing the cards to be displayed on this page.
         * It is set as a normal javascript object since GJS does not support setting
         * objects using ParamSpec.
         */
    },

    _init: function (props) {
        props = props || {};
        this._title_label = new Gtk.Label();
        this._subtitle_label = new Gtk.Label();

        this._cards = null;
        this._title = null;
        this._subtitle = null;

        props.orientation = Gtk.Orientation.VERTICAL;

        this.grid = new Gtk.Grid({
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
            expand: true,
            orientation: Gtk.Orientation.VERTICAL
        });

        this.grid.attach(this._title_label, 0, 0, 3, 1);

        let left_line = new Gtk.Separator();
        let right_line = new Gtk.Separator();

        // Not using a SearchEntry since that comes with
        // the 'x' as secondary icon, which we don't want
        this.search_box = new Gtk.Entry({
            margin_top: 30,
            primary_icon_name: 'edit-find-symbolic',
            no_show_all: true
        });
        this.search_box.connect('activate', Lang.bind(this, this._on_search_entered));

        this.grid.attach(left_line, 0, 1, 1, 1);
        this.grid.attach(this._subtitle_label, 1, 1, 1, 1);
        this.grid.attach(right_line, 2, 1, 1, 1);
        this.grid.attach(this.search_box, 0, 2, 3, 1);

        this.parent(props);

        this.add(this.grid);
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

    set has_search_box (v) {
        if (this._has_search_box === v)
            return;
        this._has_search_box = v;
        this.search_box.set_visible(this._has_search_box);
        this.notify('has-search-box');
    },

    get has_search_box () {
        return this._has_search_box;
    },

    _on_search_entered: function (widget) {
        this.emit('search-entered', widget.text);
    },

    set_styles: function (classes) {
        this.get_style_context().add_class(classes.home_page);
        this._title_label.get_style_context().add_class(classes.home_page_title);
        this._subtitle_label.get_style_context().add_class(classes.home_page_subtitle);
        if('search_box' in classes)
            this.search_box.get_style_context().add_class(classes.search_box);
    }
});
