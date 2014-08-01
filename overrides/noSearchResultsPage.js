// Copyright 2014 Endless Mobile, Inc.

const Config = imports.config;
const EosKnowledge = imports.gi.EosKnowledge;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const BackButtonOverlay = imports.backButtonOverlay;

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
    Extends: BackButtonOverlay.BackButtonOverlay,
    Properties: {
        /**
         * Property: query
         * A string with the query that was searched for. Defaults to an empty string.
         */
        'query': GObject.ParamSpec.string('query', 'Search query',
            'Query that was searched for',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, '')
    },

    _init: function (props) {
        this._title_label = new Gtk.Label({
            wrap_mode: Pango.WrapMode.WORD_CHAR,
            ellipsize: Pango.EllipsizeMode.END,
            max_width_chars: 1,
        });

        this._label_no_results = new Gtk.Label({
            label: _("We didn't find anything.")
        });

        this._label_try_again = new Gtk.Label({
            label: _("Try seaching again with different words.")
        });

        this._query = null;

        this.parent(props);

        this._title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_NO_SEARCH_RESULTS_PAGE_TITLE);
        this._label_no_results.get_style_context().add_class(EosKnowledge.STYLE_CLASS_NO_SEARCH_RESULTS_PAGE_NO_RESULTS_LABEL);
        this._label_try_again.get_style_context().add_class(EosKnowledge.STYLE_CLASS_NO_SEARCH_RESULTS_PAGE_TRY_AGAIN_LABEL);
    },

    set query (v) {
        if (this._query === v) return;
        this._query = v;
        /* TRANSLATORS: this appears on top of the search results page; %s will
        be replaced with the string that the user searched for. */
        this._title_label.label = _("Results for \"%s\"").format(this._query);
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

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_NO_SEARCH_RESULTS_PAGE_A);

        let content_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            expand: true,
            valign: Gtk.Align.FILL,
            margin_left: 100,
            margin_right: 100
        })

        let separator = new Gtk.Separator({
            halign: Gtk.Align.FILL
        });

        this._label_no_results.valign = Gtk.Align.END;
        this._label_no_results.expand = true;
        this._label_try_again.valign = Gtk.Align.START;
        this._label_try_again.expand = true;
        this._label_try_again.margin_bottom = 150;

        content_grid.add(this._title_label);
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

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_NO_SEARCH_RESULTS_PAGE_B);

        let content_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.HORIZONTAL,
            halign: Gtk.Align.START,
            valign: Gtk.Align.BASELINE,
            column_spacing: 1,
            margin_left: 100,
            margin_right: 100
        });

        this._title_label.xalign = 0;

        let label_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.HORIZONTAL,
            expand: true,
            valign: Gtk.Align.END,
            margin_bottom: 30
        });

        label_grid.attach(this._title_label, 0, 0, 2, 1);
        label_grid.attach(this._label_no_results, 0, 1, 1, 1);
        label_grid.attach(this._label_try_again, 1, 1, 1, 1);

        content_grid.add(label_grid);

        this.add(content_grid);
    }
});
