// Copyright 2016 Endless Mobile, Inc.

/* exported NoResultsMessage */

const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: NoResultsMessage
 * NoResultsMessage results module
 *
 * This is a simple, static text module for displaying an error page
 * in the case that a user's query returned no results or failed with
 * an error. Should be used in the 'no-results' slot of
 * <ContentGroup.ContentGroup>.
 */
const NoResultsMessage = new Module.Class({
    Name: 'ContentGroup.NoResultsMessage',
    Extends: Gtk.Grid,

    Properties: {
        /**
         * Property: justify
         * Horizontal justification of message text
         *
         * Default value:
         *   **Gtk.Justification.LEFT**
         */
        'justify': GObject.ParamSpec.enum('justify',
            'Justify', 'Horizontal justification of message text',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            Gtk.Justification.$gtype, Gtk.Justification.LEFT),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/contentGroup/noResultsMessage.ui',
    InternalChildren: [ 'message-subtitle', 'message-title' ],

    _init: function (props={}) {
        this.parent(props);

        this._message_title.justify = this._message_subtitle.justify = this.justify;
        this._message_title.halign = this._message_subtitle.halign = this.halign;

        // FIXME: Should be getting this from history store.
        Dispatcher.get_default().register((payload) => {
            switch (payload.action_type) {
            case Actions.SEARCH_FAILED:
                this._set_error_message();
                break;
            }
        });

        let store = HistoryStore.get_default();
        store.connect('changed', this._on_history_changed.bind(this));
    },

    _on_history_changed: function () {
      this._set_default_message();
    },

    _set_default_message: function () {
        this._message_title.label =
            "<span weight=\"bold\" size=\"xx-large\">" + _("Sorry! :-(") + "</span>\n\n" +
            _("There are no results that match your search.\n");
        this._message_subtitle.label = _("We recommend that you:\n\n" +
            "  •  Check your spelling\n" +
            "  •  Try other words that mean the same thing\n" +
            "  •  Try using more general words");
    },

    _set_error_message: function () {
        this._message_title.label = _("There was an error during your search.");
        this._message_subtitle.label = '';
    },
});
