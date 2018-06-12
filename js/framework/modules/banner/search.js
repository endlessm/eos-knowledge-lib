// Copyright 2015 Endless Mobile, Inc.

/* exported Search */

const Format = imports.format;
const Gettext = imports.gettext;
const Gtk = imports.gi.Gtk;

const Config = imports.framework.config;
const HistoryStore = imports.framework.historyStore;
const Module = imports.framework.interfaces.module;
const Utils = imports.framework.utils;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: Search
 * Banner with status information about search results
 *
 * CSS classes:
 *   title - on the banner
 *   search-terms - on the portion of the banner indicating search terms typed
 *     in by a user
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
        let item = store.search_backwards(0, item => item.search_terms);
        if (!item || !item.search_terms)
            return;

        this.label = Utils.format_ui_string(this.get_style_context(),
            _("Results for “%s”"), item.search_terms, 'search-terms');
    },
});
