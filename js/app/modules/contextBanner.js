// Copyright 2015 Endless Mobile, Inc.

/* exported ContextBanner */

const Format = imports.format;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: ContextBanner
 * Show some context about what is happening in the app
 *
 * This is a banner module that displays a different heading depending on what
 * action last happened.
 * When the home page is shown, it displays "Highlights".
 * When a set is shown, it displays the set's title.
 * When search results are shown, it displays a message with the number of
 * search results and the search text.
 *
 * This module is meant to be used in <SideMenuTemplate>'s **context** slot, but
 * can also be useful elsewhere.
 *
 * Implements:
 *   <Module>
 */
const ContextBanner = new Lang.Class({
    Name: 'ContextBanner',
    GTypeName: 'EknContextBanner',
    Extends: Gtk.Label,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        props.label = _("Highlights");
        this.parent(props);

        this._search_count = 0;

        Dispatcher.get_default().register(payload => {
            switch (payload.action_type) {
                case Actions.SHOW_HOME_PAGE:
                    this.label = _("Highlights");
                    break;
                case Actions.SHOW_ALL_SETS_PAGE:
                    this.label = _("All Categories");
                    break;
                case Actions.SHOW_ARTICLE_PAGE:
                    this.label = payload.context_label;
                    break;
                case Actions.SHOW_SET:
                    this.label = payload.model.title;
                    break;
                case Actions.CLEAR_SEARCH:
                    this._search_count = 0;
                    break;
                case Actions.APPEND_SEARCH:
                    this._search_count += payload.models.length;
                    break;
                case Actions.SEARCH_READY:
                    if (this._search_count === 0) {
                        /* TRANSLATORS: %s will be replaced with the text the user
                        searched for. Make sure to keep the %s token in your translation. */
                        this.label = _("Search results for “%s”").format(payload.query);
                    } else {
                        /* TRANSLATORS: %s will be replaced with the text the user
                        searched for. Make sure to keep %s token in your translation. */
                        this.label = _("Results were found for “%s”").format(payload.query);
                    }
                    break;
            }
        });
    },
});
