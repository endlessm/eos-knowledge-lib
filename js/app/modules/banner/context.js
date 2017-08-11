// Copyright 2015 Endless Mobile, Inc.

/* exported Context */

const Format = imports.format;
const Gettext = imports.gettext;
const Gtk = imports.gi.Gtk;

const Config = imports.app.config;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const Pages = imports.app.pages;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: Context
 * Show some context about what is happening in the app
 *
 * This is a banner module that displays a different heading depending on what
 * action last happened.
 * When the home page is shown, it displays "Highlights".
 * When a set is shown, it displays the set's title.
 * When search results are shown, it displays a message with the search text.
 *
 * This module is meant to be used in <SideMenuTemplate>'s **context** slot, but
 * can also be useful elsewhere.
 *
 * Implements:
 *   <Module>
 */
var Context = new Module.Class({
    Name: 'Banner.Context',
    Extends: Gtk.Label,

    _init: function (props={}) {
        props.label = _("Highlights");
        this.parent(props);

        HistoryStore.get_default().connect('changed',
            this._on_history_change.bind(this));
    },

    _on_history_change: function () {
        let item = HistoryStore.get_default().get_current_item();
        switch (item.page_type) {
            case Pages.HOME:
                this.label = _("Highlights");
                break;
            case Pages.ALL_SETS:
                this.label = _("All Categories");
                break;
            case Pages.ARTICLE:
            case Pages.SET:
                this.label = item.context_label;
                break;
            case Pages.SEARCH:
                /* TRANSLATORS: %s will be replaced with the text the user
                searched for. Make sure to keep the %s token in your translation. */
                this.label = _("Search results for “%s”").format(item.query);
                break;
        }
    },
});
