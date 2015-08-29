// Copyright 2015 Endless Mobile, Inc.

/* exported SearchPageA, SearchPageB */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

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

    _init: function (props) {
        this.parent(props);
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

        this._title_banner = this.factory.create_named_module('results-search-banner', {
            valign: Gtk.Align.END,
            max_width_chars: 0,
        });
        this._search_results = this.factory.create_named_module('search-results');

        this._title_frame.add(this._title_banner);
        this._content_grid.add(this._title_frame);
        this._content_grid.add(this._search_results);
        this.add(this._content_grid);

        this.get_style_context().add_class(StyleClasses.SEARCH_PAGE_B);
    },
});
