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
const Utils = imports.app.utils;

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
                    /* TRANSLATORS: This message is displayed while the
                    encyclopedia app is searching for results. The %s will be
                    replaced with the term that the user searched for. Note, in
                    English, it is surrounded by Unicode left and right double
                    quotes (U+201C and U+201D). Make sure to include %s in your
                    translation and use whatever quote marks are appropriate for
                    your language. */
                    this.label = _("Searching for “%s”").format('<span weight="normal" color="black">' +
                        payload.query + '</span>');
                    break;
                case Actions.SEARCH_READY:
                    this.label = Utils.page_title_from_query_object(payload.query);
                    break;
            }
        });
    },
});
