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

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

const SearchBannerModule = new Lang.Class({
    Name: 'SearchBannerModule',
    GTypeName: 'EknSearchBannerModule',
    Extends: Gtk.Label,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/searchBannerModule.ui',

    _init: function (props={}) {
        this.parent(props);
        Dispatcher.get_default().register((payload) => {
            switch(payload.action_type) {
                case Actions.SEARCH_STARTED:
                    /* TRANSLATORS: This message is displayed while an app is
                    searching for results. The %s will be replaced with the term
                    that the user searched for. Note, in English, it is
                    surrounded by Unicode left and right double quotes (U+201C
                    and U+201D). Make sure to include %s in your translation and
                    use whatever quote marks are appropriate for your language. */
                    this.label = this._format_ui_string(_("Searching for “%s”"),
                        payload.query);
                    break;
                case Actions.SEARCH_READY:
                    /* TRANSLATORS: This message is displayed when an app is
                    done searching for results. The %s will be replaced with the
                    term that the user searched for. Note, in English, it is
                    surrounded by Unicode left and right double quotes (U+201C
                    and U+201D). Make sure to include %s in your translation and
                    use whatever quote marks are appropriate for your language. */
                    this.label = this._format_ui_string(_("Search results for “%s”"),
                        payload.query);
                    break;
                case Actions.SEARCH_FAILED:
                    this.label = _("OOPS!");
                    break;
            }
        });
    },

    _format_ui_string: function (ui_string, query) {
        return ui_string.format('<span weight="normal" color="black">' + query +
            '</span>');
    },
});
