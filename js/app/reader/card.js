// Copyright 2015 Endless Mobile, Inc.

const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const CardIface = imports.app.interfaces.card;  // FIXME name
const Config = imports.app.config;

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
 *    card-title, title - card's label
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
    Implements: [ CardIface.Card ],

    Properties: {
        'css': GObject.ParamSpec.override('css', CardIface.Card),
        'fade-in': GObject.ParamSpec.override('fade-in', CardIface.Card),
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

    _CARD_WIDTH: 200,
    _CARD_HEIGHT: 250,

    _init: function(props={}) {
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

    // TODO: we do want all cards to be the same size, but we may want to make
    // this size scale with resolution down the road
    vfunc_get_preferred_width: function () {
        return [this._CARD_WIDTH, this._CARD_WIDTH];
    },

    vfunc_get_preferred_height: function () {
        return [this._CARD_HEIGHT, this._CARD_HEIGHT];
    },
});
