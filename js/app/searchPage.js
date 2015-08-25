// Copyright 2015 Endless Mobile, Inc.

/* exported SearchPageA, SearchPageB */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const CardsSegment = imports.app.cardsSegment;
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

    LOADING_BOTTOM_BUFFER: 250,

    _init: function (props={}) {
        this._content_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            expand: true,
            valign: Gtk.Align.START,
            row_spacing: 20,
            margin_start: 100,
            margin_end: 100,
        });

        this.parent(props);

        this._segments = {};

        this.get_style_context().add_class(StyleClasses.SEARCH_PAGE_A);

        this._right_column_size_group = new Gtk.SizeGroup({
            mode: Gtk.SizeGroupMode.HORIZONTAL
        });

        this._scrolled_window = new InfiniteScrolledWindow.InfiniteScrolledWindow({
            hscrollbar_policy: Gtk.PolicyType.NEVER,
            bottom_buffer: this.LOADING_BOTTOM_BUFFER,
        });
        this._scrolled_window.connect('need-more-content', () =>
            this.emit('load-more-results'));

        this._scrolled_window.add(this._content_grid);
        this.add(this._scrolled_window);
    },

    pack_title_banner: function (title_banner) {
        title_banner.halign = Gtk.Align.CENTER;

        let old_banner = this._content_grid.get_child_at(0, 0);
        if (old_banner)
            this._content_grid.remove(old_banner);
        this._content_grid.attach(title_banner, 0, 0, 1, 1);
    },

    append_to_segment: function (segment_title, cards) {
        if (segment_title in this._segments) {
            this._segments[segment_title].append_cards(cards);
        } else {
            let segment = new CardsSegment.CardsSegment({
                title: segment_title
            });
            this._right_column_size_group.add_widget(segment.title_label);
            segment.show_all();
            segment.append_cards(cards);
            this._segments[segment_title] = segment;
            this._content_grid.attach(segment, 0, Object.keys(this._segments).length, 1, 1);
        }
    },

    remove_segment: function (segment_title) {
        let segment = this._segments[segment_title];
        this._content_grid.remove(segment);
        this._right_column_size_group.remove_widget(segment.title_label);
        delete this._segments[segment_title];
    },

    remove_all_segments: function () {
        for (let segment_title in this._segments) {
            this.remove_segment(segment_title);
        }
    }
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

        this.orientation = Gtk.Orientation.HORIZONTAL;
        this._content_grid.add(this._title_frame);

        this._arrangement = this.factory.create_named_module('results-arrangement', {
            preferred_width: 400,
            hexpand: false,
        });
        this._arrangement.connect('need-more-content', () =>
            this.emit('load-more-results'));
        this._content_grid.add(this._arrangement);

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

    highlight_card: function (model) {
        this.clear_highlighted_cards();
        for (let card of this._cards) {
            if (card.model.ekn_id === model.ekn_id) {
                card.get_style_context().add_class(StyleClasses.HIGHLIGHTED);
                return;
            }
        }
    },

    clear_highlighted_cards: function () {
        for (let card of this._cards) {
            card.get_style_context().remove_class(StyleClasses.HIGHLIGHTED);
        }
    },

    append_cards: function (cards) {
        this._cards.push.apply(this._cards, cards);
        cards.forEach(this._arrangement.add_card, this._arrangement);
    },

    set cards (v) {
        if (this._cards === v)
            return;
        if (this._cards)
            this._arrangement.clear();
        this._cards = v;
        if (this._cards)
            this._cards.forEach(this._arrangement.add_card, this._arrangement);
    },

    get cards () {
        return this._cards;
    },
});
