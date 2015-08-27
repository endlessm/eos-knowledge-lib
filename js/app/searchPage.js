// Copyright 2015 Endless Mobile, Inc.

/* exported SearchPageA, SearchPageB */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ContentObjectModel = imports.search.contentObjectModel;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const QueryObject = imports.search.queryObject;
const StyleClasses = imports.app.styleClasses;

/**
 * Class: SearchPage
 *
 * This is an abstract class for the search results page.
 * It has a title banner widget and a set of articles to show. Articles are
 * represented by cards.
 *
 */
const SearchPage = new Lang.Class({
    Name: 'SearchPage',
    GTypeName: 'EknSearchPage',
    Extends: Gtk.Frame,
    Properties: {
        'factory': GObject.ParamSpec.object('factory', 'Factory', 'Factory',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            GObject.Object.$gtype),
        'query': GObject.ParamSpec.object('query', 'Query', 'Search query',
            GObject.ParamFlags.READWRITE, QueryObject.QueryObject),
    },

    Signals: {
        'article-selected': {
            param_types: [ ContentObjectModel.ContentObjectModel ],
        },
        'load-more-results': {},
    },

    _init: function (props) {
        this._query = null;

        this.parent(props);
    },

    pack_title_banner: function (title_banner) {
        this.add(title_banner);
    },

    get query() {
        return this._query;
    },

    set query(value) {
        if (this._query === value)
            return;
        this._query = value;

        this._title_banner = this.factory.create_named_module('results-search-banner', {
            query: this._query,
        });
        this.pack_title_banner(this._title_banner);
        this._title_banner.show_all();
        this.notify('query');
    },
});

const SearchPageA = new Lang.Class({
    Name: 'SearchPageA',
    GTypeName: 'EknSearchPageA',
    Extends: SearchPage,

    _init: function (props={}) {
        this._content_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            expand: true,
            valign: Gtk.Align.FILL,
        });

        this.parent(props);

        this._segments = {};

        this.get_style_context().add_class(StyleClasses.SEARCH_PAGE_A);

        this._search_results = this.factory.create_named_module('search-results');
        this._search_results.connect('need-more-content', () =>
            this.emit('load-more-results'));
        this._search_results.connect('article-selected', (group, article) =>
            this.emit('article-selected', article));

        this._separator = new Gtk.Separator({
            margin_start: 20,
            margin_end: 20,
        });
        this._content_grid.attach(this._separator, 0, 1, 1, 1);
        this._content_grid.attach(this._search_results, 0, 2, 1, 1);
        this.add(this._content_grid);
    },

    pack_title_banner: function (title_banner) {
        title_banner.halign = Gtk.Align.CENTER;

        let old_banner = this._content_grid.get_child_at(0, 0);
        if (old_banner)
            this._content_grid.remove(old_banner);
        this._content_grid.attach(title_banner, 0, 0, 1, 1);
    },

    append_cards: function (cards) {
        this._cards.push.apply(this._cards, cards);
        cards.forEach(this._search_results.add_card, this._search_results);
    },

    get_cards: function () {
        return this._cards;
    },

    remove_all_cards: function () {
        this._search_results.clear();
        this._cards = [];
    },
});

const SearchPageB = new Lang.Class({
    Name: 'SearchPageB',
    GTypeName: 'EknSearchPageB',
    Extends: SearchPage,

    _init: function (props={}) {
        this._cards = [];

        props.expand = true;
        this.parent(props);

        this._content_grid = new Gtk.Grid();

        this._title_frame = new Gtk.Frame();
        this._title_frame.get_style_context().add_class(StyleClasses.SEARCH_PAGE_B_TITLE_FRAME);

        this._content_grid.add(this._title_frame);

        this._search_results = this.factory.create_named_module('search-results');
        this._search_results.connect('need-more-content', () =>
            this.emit('load-more-results'));
        this._search_results.connect('article-selected', (group, article) =>
            this.emit('article-selected', article));

        this._content_grid.add(this._search_results);

        this.add(this._content_grid);

        this.get_style_context().add_class(StyleClasses.SEARCH_PAGE_B);
    },

    pack_title_banner: function (title_banner) {
        title_banner.valign = Gtk.Align.END;
        title_banner.max_width_chars = 0;

        let child = this._title_frame.get_child();
        if (child !== null)
            this._title_frame.remove(child);
        this._title_frame.add(title_banner);
    },

    append_cards: function (cards) {
        this._cards.push.apply(this._cards, cards);
        cards.forEach(this._search_results.add_card, this._search_results);
    },

    set cards (v) {
        if (this._cards === v)
            return;
        if (this._cards)
            this._search_results.clear();
        this._cards = v;
        if (this._cards)
            this._cards.forEach(this._search_results.add_card, this._search_results);
    },

    get cards () {
        return this._cards;
    },
});
