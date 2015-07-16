// Copyright 2015 Endless Mobile, Inc.

const Format = imports.format;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Config = imports.app.config;
const ContentObjectModel = imports.search.contentObjectModel;
const Module = imports.app.interfaces.module;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const RESULTS_PAGE_NAME = 'results';
const NO_RESULTS_PAGE_NAME = 'no-results';
const ERROR_PAGE_NAME = 'error';
const SPINNER_PAGE_NAME = 'spinner';

/**
 * Class: SearchModule
 * Search results module
 *
 * Module that can display a container of cards, or a message that no
 * results were found, or a message that there was an error during the search.
 *
 * FIXME: This module does not have its final API; for that, the dispatcher is
 * necessary. In addition, the API may need to be changed when adapting it to
 * other existing knowledge apps.
 *
 * CSS classes:
 *   search-results - on the widget itself
 *   headline - on the headline labels ("Searching for ...")
 *   separator - on the separator image widgets
 *   oops - on the large "OOPS!" labels
 *   error-message - on the text below the "OOPS!" labels
 */
const SearchModule = new Lang.Class({
    Name: 'SearchModule',
    GTypeName: 'EknSearchModule',
    Extends: Gtk.Stack,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
    },
    Signals: {
        /**
         * Event: article-selected
         * Indicates that a card was clicked in the search results
         *
         * FIXME: This signal is temporary, and the dispatcher will make it
         * unnecessary.
         *
         * Parameters:
         *   <ContentObjectModel> - the model of the card that was clicked
         */
        'article-selected': {
            param_types: [ ContentObjectModel.ContentObjectModel ],
        },
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/searchModule.ui',
    InternalChildren: [ 'headline', 'query-message', 'results-stack', 'spinner' ],

    _init: function (props={}) {
        this.parent(props);

        this._arrangement = this.factory.create_named_module('results-arrangement');
        this._results_stack.add_named(this._arrangement, RESULTS_PAGE_NAME);
    },

    /**
     * Method: start_search
     * Make the UI display some indication that it is busy with a search
     *
     * Parameters:
     *   query - search query that the user entered (string)
     */
    start_search: function (query) {
        this._query = query;
        /* TRANSLATORS: This message is displayed while the encyclopedia app is
        searching for results. The %s will be replaced with the term that the
        user searched for. Note, in English, it is surrounded by Unicode left
        and right double quotes (U+201C and U+201D). Make sure to include %s in
        your translation and use whatever quote marks are appropriate for your
        language. */
        this._headline.label = _("Searching for “%s”").format('<span weight="normal" color="black">' +
            this._query + '</span>');
        this.visible_child_name = RESULTS_PAGE_NAME;
        this._results_stack.visible_child_name = SPINNER_PAGE_NAME;
    },

    /**
     * Method: finish_search
     * Make the module display search results
     *
     * Removes all existing search result cards and creates new cards for the
     * supplied card models.
     * Makes the module display either the list of search results or the message
     * for no results, depending on whether there are results in the supplied
     * array.
     *
     * Parameters:
     *   results - an array of <ContentObjectModel>s
     */
    finish_search: function (results) {
        this._arrangement.clear();

        results.forEach((result) => {
            let card = this.factory.create_named_module('results-card', {
                model: result,
            });
            card.connect('clicked', (card) => {
                this.emit('article-selected', card.model);
            });
            this._arrangement.add_card(card);
        });

        this._results_stack.visible_child_name = RESULTS_PAGE_NAME;
        this.visible_child_name = results.length > 0 ? RESULTS_PAGE_NAME :
            NO_RESULTS_PAGE_NAME;

        /* TRANSLATORS: This message is displayed when the encyclopedia app
        is done searching for results. The %s will be replaced with the term
        that the user searched for. Note, in English, it is surrounded by
        Unicode left and right double quotes (U+201C and U+201D). Make sure
        to include %s in your translation and use whatever quote marks are
        appropriate for your language. */
        this._headline.label = _("Search results for “%s”").format('<span weight="normal" color="black">' +
            this._query + '</span>');
        /* TRANSLATORS: This message is displayed when the encyclopedia app did
        not find any results for a search. The %s will be replaced with the term
        that the user searched for. Note, in English, it is surrounded by
        Unicode left and right double quotes (U+201C and U+201D). Make sure to
        include %s in your translation and use whatever quote marks are
        appropriate for your language. */
        this._query_message.label = _("We did not find any results for “%s”.").format(this._query);
    },

    /**
     * Method: show_error
     * Display the error page
     *
     * This will display a generic error message instead of search results.
     *
     * Parameters:
     *   error - currently ignored, but can be used to display a more useful
     *     error message
     */
    finish_search_with_error: function (error) {
        this._arrangement.clear();
        this.visible_child_name = ERROR_PAGE_NAME;
    },
});
