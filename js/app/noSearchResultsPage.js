// Copyright 2014 Endless Mobile, Inc.

const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const Config = imports.app.config;
const NavButtonOverlay = imports.app.navButtonOverlay;
const StyleClasses = imports.app.styleClasses;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: NoSearchResultsPage
 *
 * This is an abstract class for the no-results page of the knowledge apps.
 * It is displayed when a search has zero results.
 * It has a title and a message indicating that the search performed has no results.
 *
 */
const NoSearchResultsPage = new Lang.Class({
    Name: 'NoSearchResultsPage',
    GTypeName: 'EknNoSearchResultsPage',
    Extends: NavButtonOverlay.NavButtonOverlay,
    Properties: {
        /**
         * Property: query
         * A string with the query that was searched for. Defaults to an empty string.
         */
        'query': GObject.ParamSpec.string('query', 'Search query',
            'Query that was searched for',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, '')
    },

    MSG_WE_DIDNT_FIND_ANYTHING: _("We didn't find anything."),
    MSG_TRY_AGAIN_DIFF_WORDS: _("Try seaching again with different words."),

    _init: function (props) {
        props = props || {};
        props.forward_visible = false;
        this.title_label = new Gtk.Label({
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            ellipsize: Pango.EllipsizeMode.END
        });

        this._query = null;

        this.parent(props);

        this.title_label.get_style_context().add_class(StyleClasses.NO_SEARCH_RESULTS_PAGE_TITLE);
    },

    set query (v) {
        if (this._query === v)
            return;
        this._query = v;
        /* TRANSLATORS: this appears on top of the search results page; %s will
        be replaced with the string that the user searched for. */
        this.title_label.label = _("Results for \"%s\"").format(this._query);
        this.notify('query');
    },

    get query () {
        if (this._query)
            return this._query;
        return '';
    }
});

/**
 * Class: NoSearchResultsPageA
 *
 * This class extends <NoSearchResultsPage> and represents the no-search-results page for 
 * template A of the knowledge apps.
 *
 */
const NoSearchResultsPageA = new Lang.Class({
    Name: 'NoSearchResultsPageA',
    GTypeName: 'EknNoSearchResultsPageA',
    Extends: NoSearchResultsPage,

    _init: function (props) {
        this.parent(props);

        this.get_style_context().add_class(StyleClasses.NO_SEARCH_RESULTS_PAGE_A);

        let content_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            expand: true,
            valign: Gtk.Align.FILL,
            margin_start: 100,
            margin_end: 100
        });

        let separator = new Gtk.Separator({
            halign: Gtk.Align.FILL
        });

        this._label_no_results = new Gtk.Label({
            label: this.MSG_WE_DIDNT_FIND_ANYTHING,
            valign: Gtk.Align.END,
            expand: true
        });

        this._label_try_again = new Gtk.Label({
            label: this.MSG_TRY_AGAIN_DIFF_WORDS,
            valign: Gtk.Align.START,
            expand: true
        });
        this._label_no_results.get_style_context().add_class(StyleClasses.NO_SEARCH_RESULTS_PAGE_NO_RESULTS_LABEL);
        this._label_try_again.get_style_context().add_class(StyleClasses.NO_SEARCH_RESULTS_PAGE_TRY_AGAIN_LABEL);

        content_grid.add(this.title_label);
        content_grid.add(separator);
        content_grid.add(this._label_no_results);
        content_grid.add(this._label_try_again);

        this.add(content_grid);

        this.show_all();
    }
});

/**
 * Class: NoSearchResultsPageB
 *
 * This class extends <NoSearchResultsPage> and represents the no-search-results page for 
 * template B of the knowledge apps.
 *
 */
const NoSearchResultsPageB = new Lang.Class({
    Name: 'NoSearchResultsPageB',
    GTypeName: 'EknNoSearchResultsPageB',
    Extends: NoSearchResultsPage,

    _init: function (props) {
        props = props || {};
        props.valign = Gtk.Align.BASELINE;
        this.parent(props);

        this.get_style_context().add_class(StyleClasses.NO_SEARCH_RESULTS_PAGE_B);

        let content_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.HORIZONTAL,
            halign: Gtk.Align.START,
            valign: Gtk.Align.BASELINE
        });

        this.title_label.xalign = 0;

        // Since we have two separate strings in Template A's page, we reuse the same translations
        let _not_found_msg = this.MSG_WE_DIDNT_FIND_ANYTHING + ' ' + this.MSG_TRY_AGAIN_DIFF_WORDS;
        this._label_no_results = new Gtk.Label({
            label: _not_found_msg,
            valign: Gtk.Align.END,
            halign: Gtk.Align.START,
            xalign: 0,
            expand: true,
            wrap: true
        });
        this._label_no_results.get_style_context().add_class(StyleClasses.NO_SEARCH_RESULTS_PAGE_NO_RESULTS_LABEL);

        let label_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            expand: true,
            valign: Gtk.Align.END
        });

        label_grid.add(this.title_label);
        label_grid.add(this._label_no_results);

        content_grid.add(label_grid);

        this.add(content_grid);
    }
});
