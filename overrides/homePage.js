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
 *
 * To work properly, subclasses will want to implement the 'pack_widgets'
 * and 'pack_cards' methods.
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
         * Property: cards
         * A list of Card objects representing the cards to be displayed on this page.
         * It is set as a normal javascript object since GJS does not support setting
         * objects using ParamSpec.
         */
    },

    Signals: {
        /**
         * Event: article-selected
         *
         * This event is triggered when an article is selected from the autocomplete menu.
         */
        'article-selected': {
            param_types: [GObject.TYPE_STRING]
        },
        /**
         * Event: search-entered
         * This event is triggered when the search box is activated. The parameter
         * is the search query.
         */
        'search-entered': {
            param_types: [GObject.TYPE_STRING]
        },

        /**
         * Event: search-text-changed
         * This event is triggered when the text in the search box is changed. The parameter
         * is the search box.
         */
        'search-text-changed': {
            param_types: [GObject.TYPE_OBJECT]
        }
    },

    _init: function (props) {
        props = props || {};
        this.title_label = new Gtk.Label();
        this.subtitle_label = new Gtk.Label();

        this._cards = null;
        this._title = null;
        this._subtitle = null;

        // Not using a SearchEntry since that comes with
        // the 'x' as secondary icon, which we don't want
        this.search_box = new Endless.SearchBox();

        this.search_box.connect('text-changed', Lang.bind(this, function (search_entry) {
            this.emit('search-text-changed', search_entry);
        }));

        this.search_box.connect('activate', Lang.bind(this, function (search_entry) {
            this.emit('search-entered', search_entry.text);
        }));

        this.search_box.connect('menu-item-selected', Lang.bind(this, function (search_entry, article_id) {
            this.emit('article-selected', article_id);
        }));

        this.parent(props);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_HOME_PAGE);
        this.title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_HOME_PAGE_TITLE);
        this.subtitle_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_HOME_PAGE_SUBTITLE);
        this.search_box.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SEARCH_BOX);

        this.pack_widgets();
        this.show_all();
    },

    /**
     * Method: pack_widgets
     *
     * A virtual function to be overridden in subclasses. _init will set up
     * three widgets: title_label, subtitle_label and seach_box, and then call
     * into this virtual function.
     *
     * title_label and subtitle_label will contain the title and subtitle
     * properties in labels with proper style classes, and the search_box is a
     * GtkEntry all connectified for homePage search signals. They can be
     * packed into this widget along with any other widgetry for the subclass
     * in this function.
     */
    pack_widgets: function () {
        this.add(this.title_label);
        this.add(this.subtitle_label);
        this.add(this.search_box);
    },

    /**
     * Method: pack_cards
     *
     * A virtual function to be overridden in subclasses. This will be called,
     * whenever the card list changes with a new list of cards to be packed in
     * the widget
     */
    pack_cards: function (cards) {
        // no-op
    },

    set title (v) {
        if (this._title === v) return;
        this._title = v;
        this.title_label.label = this._title.toUpperCase();
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
        this.subtitle_label.label = this._subtitle;
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
        this._cards = v;
        if (this._cards === null) {
            this.pack_cards([]);
        } else {
            this.pack_cards(this._cards);
        }
    },

    get cards () {
        return this._cards;
    },

    _on_search_entered: function (widget) {
        this.emit('search-entered', widget.text);
    },
});
