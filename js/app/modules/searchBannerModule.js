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

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: SearchBannerModule
 * Banner with status information about search results
 *
 * CSS classes:
 *   title - on the banner
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

    // This allows styling a sub-region of the GtkLabel with an extra CSS class.
    // For example, you can specify:
    // .title { color: white; }
    // .title.query { weight: bold; color: black; }
    // It supports the CSS properties font-family, font-weight, font-style, and
    // color.
    _format_ui_string: function (ui_string, query) {
        let context = this.get_style_context();
        context.save();
        context.add_class(StyleClasses.QUERY);
        let span = _style_context_to_markup_span(context, Gtk.StateFlags.NORMAL);
        context.restore();

        return ui_string.format(span + query + '</span>');
    },
});

function _rgba_to_markup_color(rgba) {
    // Ignore alpha, as Pango doesn't render it.
    return '#%02x%02x%02x'.format(rgba.red * 255, rgba.green * 255,
        rgba.blue * 255);
}

function _style_context_to_markup_span(context, state) {
    let font = context.get_font(state);
    let foreground = context.get_color(state);
    const _PANGO_STYLES = ['normal', 'oblique', 'italic'];
    // Unfortunately, ignore the font size; PangoFontDescriptions don't deal
    // well with font sizes in ems.
    let properties = {
        'face': font.get_family(),
        'style': _PANGO_STYLES[font.get_style()],
        'weight': font.get_weight(),
        'color': _rgba_to_markup_color(foreground),
    };
    let properties_string = Object.keys(properties).map((key) =>
        key + '="' + properties[key] + '"').join(' ');
    return '<span ' + properties_string + '>';
}
