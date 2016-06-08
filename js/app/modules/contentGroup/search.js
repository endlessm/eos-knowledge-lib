// Copyright 2015 Endless Mobile, Inc.

/* exported Search */

const Format = imports.format;
const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const RESULTS_PAGE_NAME = 'results';
const MESSAGE_PAGE_NAME = 'message';
const SPINNER_PAGE_NAME = 'spinner';

/**
 * Class: Search
 * Search results module
 *
 * Module that can display cards delivered in batches using
 * <Actions.APPEND_SEARCH>, or show a message that no results were found, or a
 * message that there was an error during the search.
 *
 * Any cards lazily loaded after the first batch are faded in.
 *
 * CSS classes:
 *   search-results - on the widget itself
 *   no-results - on the widget when showing a no results message
 *   results-message-title - on the title text showing a no results message
 *   results-message-subtitle - on the subtitle text showing a no results message
 *   error-message - on the text showing an error
 *
 * Slots:
 *   arrangement
 *   article-suggestions - optional
 *   category-suggestions - optional
 */
const Search = new Module.Class({
    Name: 'ContentGroup.Search',
    Extends: Gtk.Stack,

    Properties: {
        /**
         * Property: message-justify
         * Horizontal justification of message text
         *
         * Default value:
         *   **Gtk.Justification.LEFT**
         */
        'message-justify': GObject.ParamSpec.enum('message-justify',
            'Message justify', 'Horizontal justification of message text',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            Gtk.Justification.$gtype, Gtk.Justification.LEFT),
        /**
         * Property: message-valign
         * Vertical alignment of message text
         *
         * Default value:
         *   **Gtk.Align.START**
         */
        'message-valign': GObject.ParamSpec.enum('message-valign',
            'Message valign', 'Vertical alignment of message text',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            Gtk.Align.$gtype, Gtk.Align.START),
        /**
         * Property: message-halign
         * Horizontal alignment of message text
         *
         * Default value:
         *   **Gtk.Align.START**
         */
        'message-halign': GObject.ParamSpec.enum('message-halign',
            'Message halign', 'Horizontal alignment of message text',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            Gtk.Align.$gtype, Gtk.Align.START),
    },

    Slots: {
        'arrangement': {},
        'article-suggestions': {},  // optional
        'category-suggestions': {},  // optional
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/contentGroup/search.ui',
    InternalChildren: [ 'message-grid', 'message-subtitle', 'message-title',
        'no-results-grid', 'spinner' ],

    _init: function (props={}) {
        this._query = '';
        this.parent(props);
        this._arrangement = this.create_submodule('arrangement');
        this._arrangement.connect('card-clicked', (arrangement, model) => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SEARCH_CLICKED,
                model: model,
                context: arrangement.get_models(),
                query: this._query,
            });
        });
        this.add_named(this._arrangement, RESULTS_PAGE_NAME);

        this._suggested_articles_module = this.create_submodule('article-suggestions');
        if (this._suggested_articles_module)
            this._no_results_grid.add(this._suggested_articles_module);
        this._suggested_categories_module = this.create_submodule('category-suggestions');
        if (this._suggested_categories_module)
            this._no_results_grid.add(this._suggested_categories_module);

        this._message_title.justify = this._message_subtitle.justify = this.message_justify;
        this._no_results_grid.valign = this.message_valign;
        this._message_grid.halign = this._message_title.halign =
            this._message_subtitle.halign = this.message_halign;

        let dispatcher = Dispatcher.get_default();
        if (this._arrangement instanceof InfiniteScrolledWindow.InfiniteScrolledWindow) {
            this._arrangement.connect('need-more-content', () => {
                dispatcher.dispatch({
                    action_type: Actions.NEED_MORE_SEARCH,
                });
            });
        }
        this.connect('notify::visible-child', () => {
            this._spinner.active = this.visible_child_name === SPINNER_PAGE_NAME;
        });

        dispatcher.register((payload) => {
            switch (payload.action_type) {
            case Actions.CLEAR_SEARCH:
                this._arrangement.clear();
                break;
            case Actions.APPEND_SEARCH:
                this._query = payload.query;
                this._arrangement.fade_cards =
                    (this._arrangement.get_count() > 0);
                this._arrangement.highlight_string(payload.query);
                payload.models.forEach(this._arrangement.add_model, this._arrangement);

                if (this._arrangement instanceof InfiniteScrolledWindow.InfiniteScrolledWindow) {
                    this._arrangement.new_content_added();
                }
                break;
            case Actions.SEARCH_STARTED:
                this.visible_child_name = SPINNER_PAGE_NAME;
                break;
            case Actions.SEARCH_READY:
                this._finish_search(payload.query);
                break;
            case Actions.SEARCH_FAILED:
                this._finish_search_with_error(payload.error);
                break;
            case Actions.HIGHLIGHT_ITEM:
                this._arrangement.highlight(payload.model);
                break;
            case Actions.CLEAR_HIGHLIGHTED_ITEM:
                this._arrangement.clear_highlight();
                break;
            }
        });
    },

    _finish_search: function (query) {
        let count = this._arrangement.get_count();
        if (count > 0) {
            this.visible_child_name = RESULTS_PAGE_NAME;
            this.get_style_context().remove_class('no-results');
        } else {
            let context = this._message_title.get_style_context();
            context.remove_class('error-message');
            context.add_class('results-message-title');
            // FIXME: I think we want to set a larger line-height value here
            // but not possible in GTK CSS
            this._message_title.label =
                "<span weight=\"bold\" size=\"xx-large\">" + _("Sorry! :-(") + "</span>\n\n" +
                _("There are no results that match your search.\n");

            this._message_subtitle.label = _("We recommend that you:\n\n" +
                  "  •  Check your spelling\n" +
                  "  •  Try other words that mean the same thing\n" +
                  "  •  Try using more general words");

            Dispatcher.get_default().dispatch({
                action_type: Actions.CLEAR_SUGGESTED_ARTICLES,
            });

            Dispatcher.get_default().dispatch({
                action_type: Actions.NEED_MORE_SUGGESTED_ARTICLES,
                query: query,
            });

            this.visible_child_name = MESSAGE_PAGE_NAME;
            this.get_style_context().add_class('no-results');
        }
    },

    // This will display a generic error message instead of search results.
    // error parameter is currently ignored, but can be used to display a more
    // useful error message
    _finish_search_with_error: function (error) {
        this._arrangement.clear();
        let context = this._message_title.get_style_context();
        context.remove_class('results-message-title');
        context.add_class('error-message');
        this._message_title.label = _("There was an error during your search.");
        this._message_subtitle = "";
        this.visible_child_name = MESSAGE_PAGE_NAME;
    },
});
