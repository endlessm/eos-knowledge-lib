// Copyright 2015 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const InfiniteScrolledWindow = imports.infiniteScrolledWindow;

/**
 * Class: Reader.SearchResultsPage
 * Page to show snippets of the results of a search.
 */
const SearchResultsPage = new Lang.Class({
    Name: 'SearchResultsPage',
    GTypeName: 'EknReaderSearchResultsPage',
    Extends: Gtk.Frame,

    Signals: {
        /**
         * Event: load-more-results
         * This event is triggered when the scrollbar reaches the bottom or
         * when the scrollbar does not exist.
         */
        'load-more-results': {},
    },

    _FLOW_BOX_CHILDREN_PER_LINE: 20,
    _FLOW_BOX_COL_SPACING: 10,
    _FLOW_BOX_ROW_SPACING: 10,
    _FLOW_BOX_MARGIN: 40,
    _LOADING_BOTTOM_BUFFER: 250,

    _init: function (props={}) {
        this.parent(props);

        let scrolled_window = new InfiniteScrolledWindow.InfiniteScrolledWindow({
            hscrollbar_policy: Gtk.PolicyType.NEVER,
            bottom_buffer: this._LOADING_BOTTOM_BUFFER,
        });
        scrolled_window.connect('notify::need-more-content', () => {
            if (scrolled_window.need_more_content) {
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

        scrolled_window.add(this._content_flow_box);
        this.add(scrolled_window);
    },

    append_search_results: function (results) {
        for (let result of results) {
            this._content_flow_box.add(result);
        }
    },

    clear_search_results: function () {
        let results = this._content_flow_box.get_children();
        for (let result of results) {
            this._content_flow_box.remove(result);
        }
    },
});
