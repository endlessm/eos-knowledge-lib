// Copyright 2015 Endless Mobile, Inc.

/* exported Search */

const Format = imports.format;
const Gettext = imports.gettext;
const Gtk = imports.gi.Gtk;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
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
 *   results-message - on the banner when displaying status about results
 *   error-message - on the banner when displaying status about an error
 *   query - on the portion of the banner indicating a user query string
 */
const Search = new Module.Class({
    Name: 'Banner.Search',
    CssName: 'EknSearchBanner',
    Extends: Gtk.Label,

    Template: 'resource:///com/endlessm/knowledge/data/widgets/banner/search.ui',

    _init: function (props={}) {
        this.parent(props);
        Dispatcher.get_default().register((payload) => {
            let context = this.get_style_context();
            switch(payload.action_type) {
                case Actions.SEARCH_STARTED:
                    context.remove_class('error-message');
                    context.add_class('results-message-title');
                    /* TRANSLATORS: This message is displayed while an app is
                    searching for results. The %s will be replaced with the term
                    that the user searched for. Note, in English, it is
                    surrounded by Unicode left and right double quotes (U+201C
                    and U+201D). Make sure to include %s in your translation and
                    use whatever quote marks are appropriate for your language. */
                    this.label = Utils.format_ui_string(this.get_style_context(), _("Searching for “%s”"),
                        payload.query, 'query');
                    break;
                case Actions.SEARCH_READY:
                    context.remove_class('error-message');
                    context.add_class('results-message-title');
                    /* TRANSLATORS: This message is displayed when an app is
                    done searching for results. The %s will be replaced with the
                    term that the user searched for. Note, in English, it is
                    surrounded by Unicode left and right double quotes (U+201C
                    and U+201D). Make sure to include %s in your translation and
                    use whatever quote marks are appropriate for your language. */
                    this.label = Utils.format_ui_string(this.get_style_context(), _("Results for “%s”"),
                        payload.query, 'query');
                    break;
                case Actions.SEARCH_FAILED:
                    context.remove_class('results-message-title');
                    context.add_class('error-message');
                    this.label = _("OOPS!");
                    break;
            }
        });
    },
});
