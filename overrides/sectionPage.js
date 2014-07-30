// Copyright 2014 Endless Mobile, Inc.

const Config = imports.config;
const EosKnowledge = imports.gi.EosKnowledge;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const InfiniteScrolledWindow = imports.infiniteScrolledWindow;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: SectionPage
 *
 * This is an abstract class for the section page of the knowledge apps.
 * It will also be used as the search results page.
 * It has a title and a set of articles to show. Articles are represented
 * by cards.
 *
 */
const SectionPage = new Lang.Class({
    Name: 'SectionPage',
    GTypeName: 'EknSectionPage',
    Extends: Gtk.Grid,
    Properties: {
        /**
         * Property: title
         * A string with the title of the section page. Defaults to an empty string.
         */
        'title': GObject.ParamSpec.string('title', 'Page Title',
            'Title of the page',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
        /**
         * Property: query
         * A string to track the query that was performed and whose results are displayed by this sectionPage.
         * Defaults to an empty string.
         */
        'query':  GObject.ParamSpec.string('query', 'Search Query',
            'Query performed and whose results are displayed by this SectionPage',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, '')
    },

    Signals: {
        /**
         * Event: load-more-results
         * This event is triggered when the scrollbar reaches the bottom or
         * when the scrollbar does not exist.
         */
        'load-more-results': {}
    },

    _init: function (props) {
        this._title_label = new Gtk.Label({
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            ellipsize: Pango.EllipsizeMode.END,
            max_width_chars: 1,
        });

        this._content_stack = new Gtk.Stack({
            transition_type: Gtk.StackTransitionType.CROSSFADE
        });

        this._no_search_results_label = new Gtk.Label({
            wrap: true,
            justify: Gtk.Justification.CENTER,
            max_width_chars: 12
        });

        this._title = null;

        this.parent(props);

        this._title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SECTION_PAGE_TITLE);
        this._scroller = new InfiniteScrolledWindow.InfiniteScrolledWindow();
        this._scroller.connect('notify::need-more-content', Lang.bind(this, function () {
            if (this._scroller.need_more_content) {
                this.emit('load-more-results');
            }
        }))
        this._no_search_results_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SECTION_PAGE_NO_SEARCH_RESULTS);

        this.pack_title_label(this._title_label, this._scroller);
        this.show_all();
    },

    pack_title_label: function (title_label, scrolled_window) {
        this.add(title_label);
        this.add(scrolled_window);
    },

    display_no_results_message: function () {
        this._no_search_results_label.label = _(
            "OOPS! We didn't find anything about '%s'.\nTry searching again with different words."
        ).format(this._query);
        this._content_stack.visible_child = this._no_search_results_label;
    },

    set title (v) {
        if (this._title === v) return;
        this._title = v;
        this._title_label.label = this._title;
        this.notify('title');
    },

    get title () {
        if (this._title)
            return this._title;
        return '';
    },

    set query (v) {
        if (this._query === v)
            return;
        this._query = v;
        this.notify('query');
    },

    get query () {
        if (this._query)
            return this._query;
        return ''
    }
});
