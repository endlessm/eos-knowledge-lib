// Copyright 2015 Endless Mobile, Inc.

/* exported Search */

const Format = imports.format;
const Gettext = imports.gettext;
const Gtk = imports.gi.Gtk;

const Config = imports.app.config;
const HistoryStore = imports.app.historyStore;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: Search
 * Banner with status information about search results
 *
 * CSS classes:
 *   title - on the banner
 *   query - on the portion of the banner indicating a user query string
 */
var Search = new Module.Class({
    Name: 'Banner.Search',
    Extends: Gtk.Label,

    Template: 'resource:///com/endlessm/knowledge/data/widgets/banner/search.ui',

    _init: function (props={}) {
        this.parent(props);
        HistoryStore.get_default().connect('changed',
            this._on_history_changed.bind(this));
    },

    // FIXME: restore functionality of "Searching for X" and error messages
    // https://phabricator.endlessm.com/T12291
    _on_history_changed: function (store) {
        let item = store.search_backwards(0, item => item.query);
        if (!item || !item.query)
            return;

        this.label = Utils.format_ui_string(this.get_style_context(),
            _("Results for “%s”"), item.query, 'query');
    },
});
