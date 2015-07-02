// Copyright 2015 Endless Mobile, Inc.

const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const CardIface = imports.app.interfaces.card;  // FIXME name
const Config = imports.app.config;
const Themeable = imports.app.interfaces.themeable;
const Utils = imports.app.utils;

let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: Reader.Card
 *
 * A card implementation with sizing and styling specific to Reader apps.
 *
 * CSS Styles:
 *    card, reader-card - on the card itself
 *    card-info-frame - card info frame
 *    card-info-title - card info title
 *    title - card's label
 *    decorative-bar - ornament on the top of the card
 *    hover-frame - hover frame
 *    reader-card0 - Style variant #0
 *    reader-card1 - Style variant #1
 *    reader-card2 - Style variant #2
 */
const Card = new Lang.Class({
    Name: 'Card',
    GTypeName: 'EknReaderCard',
    Extends: Gtk.Button,
    Implements: [ CardIface.Card, Themeable.Themeable ],

    Properties: {
        'css': GObject.ParamSpec.override('css', Themeable.Themeable),
        'model': GObject.ParamSpec.override('model', CardIface.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            CardIface.Card),
        /**
         * Property: archived
         */
        'archived': GObject.ParamSpec.boolean('archived', 'Archived',
            'Whether the Reader Card represents an archived article. Defaults to "false"',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY, false),

        /**
         * Property: page-number
         */
        'page-number': GObject.ParamSpec.uint('page-number', 'Page Number',
            'Page Number of the article within the current set of articles. Only applies when the card\'s "archived" property is set to "false".',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, 0),

        /**
         * Property: style-variant
         */
        'style-variant': GObject.ParamSpec.uint('style-variant', 'Style Variant',
            'Reader card style variant. Default value is 0.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, 0),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/readerCard.ui',
    Children: [ 'title-label' ],
    InternalChildren: [ 'archive-icon', 'card-info-grid', 'card-info-label',
        'hover-frame' ],

    _init: function(props={}) {
        // TODO: we do want all cards to be the same size, but we may want to
        // make this size scale with resolution down the road
        props.width_request = 200;
        props.height_request = 250;
        this.parent(props);
        this.populate_from_model();

        if (!this.archived) {
            this._card_info_label.label = (_("Page %s").format('<b>' + this.page_number + '</b>'));
            this._card_info_grid.remove(this._archive_icon);
        }

        this.connect('enter-notify-event', () => {
            this._hover_frame.show();
        });

        this.connect('leave-notify-event', () => {
            this._hover_frame.hide();
        });
    },

    get style_variant () {
        return this._style_variant;
    },

    set style_variant (v) {
        if (this._style_variant === v) return;

        // Remove style variant classes.
        let style_variants = [
            'reader-card0',
            'reader-card1',
            'reader-card2',
        ];
        style_variants.map((style_variant_class) => {
            this.get_style_context().remove_class(style_variant_class);
        });

        this.get_style_context().add_class('reader-card' + v);
        this._style_variant = v;
        this.notify('style-variant');
    },
});

function get_css_for_module (css_data, num) {
    let str = "";
    let background_color = css_data['title-background-color'];
    if (typeof background_color !== 'undefined') {
        str += Utils.object_to_css_string({'background-color': background_color}, '.reader-card' + num + ' .decorative-bar');
        delete css_data['title-background-color'];
    }
    let title_data = Utils.get_css_for_submodule('title', css_data);
    let str = Utils.object_to_css_string(title_data, '.reader-card' + num + ' .title');
    let module_data = Utils.get_css_for_submodule('module', css_data);
    str += Utils.object_to_css_string(module_data, '.reader-card' + num + ' .attribution');
    return str;
}
