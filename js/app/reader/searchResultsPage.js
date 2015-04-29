// Copyright 2015 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Config = imports.app.config;
const InfiniteScrolledWindow = imports.app.infiniteScrolledWindow;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: Reader.SearchResultsPage
 * Page to show snippets of the results of a search.
 */
const SearchResultsPage = new Lang.Class({
    Name: 'SearchResultsPage',
    GTypeName: 'EknReaderSearchResultsPage',
    Extends: Gtk.Frame,
    Properties: {
        /**
         * Property: no-results-label
         * A label showing a 'no results' message.
         */
        'no-results-label': GObject.ParamSpec.object('no-results-label', 'No results label',
            'Label showing no results message',
            GObject.ParamFlags.READABLE,
            Gtk.Label),
    },

    Signals: {
        /**
         * Event: load-more-results
         * This event is triggered when the scrollbar reaches the bottom or
         * when the scrollbar does not exist.
         */
        'load-more-results': {},
    },

    _FLOW_BOX_CHILDREN_PER_LINE: 20,
    _FLOW_BOX_COL_SPACING: 15,
    _FLOW_BOX_ROW_SPACING: 15,
    _FLOW_BOX_MARGIN: 80,
    _LOADING_BOTTOM_BUFFER: 250,

    _init: function (props={}) {
        this.parent(props);

        this._scrolled_window = new InfiniteScrolledWindow.InfiniteScrolledWindow({
            hscrollbar_policy: Gtk.PolicyType.NEVER,
            bottom_buffer: this._LOADING_BOTTOM_BUFFER,
        });
        this._scrolled_window.connect('notify::need-more-content', () => {
            if (this._scrolled_window.need_more_content) {
                this.emit('load-more-results');
            }
        });

        this._content_flow_box = new Gtk.FlowBox({
            valign: Gtk.Align.START,
            halign: Gtk.Align.START,
            homogeneous: true,
            expand: true,
            max_children_per_line: this._FLOW_BOX_CHILDREN_PER_LINE,
            column_spacing: this._FLOW_BOX_COL_SPACING,
            row_spacing: this._FLOW_BOX_ROW_SPACING,
            margin: this._FLOW_BOX_MARGIN,
        });

        this.no_results_label = new Gtk.Label({
            label: _("There are no results for your search"),
            no_show_all: true,
        });
        this.no_results_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_NO_SEARCH_RESULTS_PAGE_NO_RESULTS_LABEL);

        let overlay = new Gtk.Overlay();
        overlay.add(this._scrolled_window);
        overlay.add_overlay(this.no_results_label);
        this._scrolled_window.add(this._content_flow_box);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_READER_SEARCH_RESULTS_PAGE);
        this.add(overlay);
    },

    append_search_results: function (results) {
        for (let result of results) {
            this._content_flow_box.add(result);
        }
        this._scrolled_window.need_more_content = false;
    },

    clear_search_results: function () {
        let results = this._content_flow_box.get_children();
        for (let result of results) {
            this._content_flow_box.remove(result);
        }
    },
});
