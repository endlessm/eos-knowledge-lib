// Copyright 2015 Endless Mobile, Inc.

const Format = imports.format;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const RESULTS_PAGE_NAME = 'results';
const MESSAGE_PAGE_NAME = 'message';
const SPINNER_PAGE_NAME = 'spinner';

/**
 * Class: SearchModule
 * Search results module
 *
 * Module that can display a container of cards, or a message that no
 * results were found, or a message that there was an error during the search.
 *
 * CSS classes:
 *   search-results - on the widget itself
 *   results-message - on the text showing a no results message
 *   error-message - on the text showing an error
 */
const SearchModule = new Lang.Class({
    Name: 'SearchModule',
    GTypeName: 'EknSearchModule',
    Extends: Gtk.Stack,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
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

    Template: 'resource:///com/endlessm/knowledge/widgets/searchModule.ui',
    InternalChildren: [ 'message' ],

    _init: function (props={}) {
        this.parent(props);
        this._arrangement = this.create_submodule('arrangement');
        this.add_named(this._arrangement, RESULTS_PAGE_NAME);

        this._message.justify = this.message_justify;
        this._message.valign = this.message_valign;
        this._message.halign = this.message_halign;

        let dispatcher = Dispatcher.get_default();
        if (this._arrangement instanceof InfiniteScrolledWindow.InfiniteScrolledWindow) {
            this._arrangement.connect('need-more-content', () => dispatcher.dispatch({
                action_type: Actions.NEED_MORE_SEARCH,
            }));
        }

        dispatcher.register((payload) => {
            switch (payload.action_type) {
            case Actions.CLEAR_SEARCH:
                this._arrangement.clear();
                break;
            case Actions.APPEND_SEARCH:
                payload.models.forEach(this._add_card, this);
                break;
            case Actions.SEARCH_STARTED:
                this.visible_child_name = SPINNER_PAGE_NAME;
                break;
            case Actions.SEARCH_READY:
                this._finish_search();
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

    // Module override
    get_slot_names: function () {
        return ['arrangement', 'card-type'];
    },

    _add_card: function (model) {
        let card = this.create_submodule('card-type', {
            model: model,
        });
        card.connect('clicked', () => {
            Dispatcher.get_default().dispatch({
                action_type: Actions.SEARCH_CLICKED,
                model: model,
            });
        });
        this._arrangement.add_card(card);
    },

    _finish_search: function () {
        let count = this._arrangement.get_cards().length;
        if (count > 0) {
            this.visible_child_name = RESULTS_PAGE_NAME;
        } else {
            let context = this._message.get_style_context();
            context.remove_class(StyleClasses.ERROR_MESSAGE);
            context.add_class(StyleClasses.RESULTS_MESSAGE);
            this._message.label =
                _("There are no results that match your search.\nTry searching for something else.");
            this.visible_child_name = MESSAGE_PAGE_NAME;
        }
    },

    // This will display a generic error message instead of search results.
    // error parameter is currently ignored, but can be used to display a more
    // useful error message
    _finish_search_with_error: function (error) {
        this._arrangement.clear();
        let context = this._message.get_style_context();
        context.remove_class(StyleClasses.RESULTS_MESSAGE);
        context.add_class(StyleClasses.ERROR_MESSAGE);
        this._message.label = _("There was an error during your search.");
        this.visible_child_name = MESSAGE_PAGE_NAME;
    },
});
