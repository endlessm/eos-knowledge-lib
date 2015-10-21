// Copyright 2015 Endless Mobile, Inc.

const Format = imports.format;
const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Actions = imports.app.actions;
const Config = imports.app.config;
const Dispatcher = imports.app.dispatcher;
const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;
const Utils = imports.app.utils;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: SearchBannerModule
 * Banner with status information about search results
 *
 * CSS classes:
 *   title - on the banner
 *   results-message - on the banner when displaying status about results
 *   error-message - on the banner when displaying status about an error
 *   query - on the portion of the banner indicating a user query string
 */
const SearchBannerModule = new Lang.Class({
    Name: 'SearchBannerModule',
    GTypeName: 'EknSearchBannerModule',
    Extends: Gtk.Label,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/searchBannerModule.ui',

    _init: function (props={}) {
        this.parent(props);
        Dispatcher.get_default().register((payload) => {
            let context = this.get_style_context();
            switch(payload.action_type) {
                case Actions.SEARCH_STARTED:
                    context.remove_class(StyleClasses.ERROR_MESSAGE);
                    context.add_class(StyleClasses.RESULTS_MESSAGE_TITLE);
                    /* TRANSLATORS: This message is displayed while an app is
                    searching for results. The %s will be replaced with the term
                    that the user searched for. Note, in English, it is
                    surrounded by Unicode left and right double quotes (U+201C
                    and U+201D). Make sure to include %s in your translation and
                    use whatever quote marks are appropriate for your language. */
                    this.label = Utils.format_ui_string(this.get_style_context(), _("Searching for “%s”"),
                        payload.query, StyleClasses.QUERY);
                    break;
                case Actions.SEARCH_READY:
                    context.remove_class(StyleClasses.ERROR_MESSAGE);
                    context.add_class(StyleClasses.RESULTS_MESSAGE_TITLE);
                    /* TRANSLATORS: This message is displayed when an app is
                    done searching for results. The %s will be replaced with the
                    term that the user searched for. Note, in English, it is
                    surrounded by Unicode left and right double quotes (U+201C
                    and U+201D). Make sure to include %s in your translation and
                    use whatever quote marks are appropriate for your language. */
                    this.label = Utils.format_ui_string(this.get_style_context(), _("Search results for “%s”"),
                        payload.query, StyleClasses.QUERY);
                    break;
                case Actions.SEARCH_FAILED:
                    context.remove_class(StyleClasses.RESULTS_MESSAGE_TITLE);
                    context.add_class(StyleClasses.ERROR_MESSAGE);
                    this.label = _("OOPS!");
                    break;
            }
        });
    },
});
