// Copyright 2015 Endless Mobile, Inc.

const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const Config = imports.app.config;
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
 */
const ReaderCard = new Lang.Class({
    Name: 'ReaderCard',
    GTypeName: 'EknReaderCard',
    Extends: Gtk.Button,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
        'context-capitalization': GObject.ParamSpec.override('context-capitalization',
            Card.Card),
        'highlight-string': GObject.ParamSpec.override('highlight-string', Card.Card),
        'text-halign': GObject.ParamSpec.override('text-halign', Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/readerCard.ui',
    InternalChildren: [  'title-label', 'archive-icon', 'card-info-grid',
        'card-info-label', 'hover-frame' ],

    _init: function(props={}) {
        // TODO: we do want all cards to be the same size, but we may want to
        // make this size scale with resolution down the road
        props.width_request = 200;
        props.height_request = 250;
        this.parent(props);

        this.set_title_label_from_model(this._title_label);
        this.set_style_variant_from_model();

        // page_number of -1 means an archived article
        if (this.model.page_number > 0) {
            this._card_info_label.label = (_("Page %s").format('<b>' + (this.model.page_number + 1) + '</b>'));
            this._card_info_grid.remove(this._archive_icon);
        }

        this.connect('enter-notify-event', () => {
            this._hover_frame.show();
        });

        this.connect('leave-notify-event', () => {
            this._hover_frame.hide();
        });
    },

    // For entirely fixed-size cards

    vfunc_get_preferred_width: function () {
        let [min] = this.parent();
        return [min, min];
    },

    vfunc_get_preferred_height: function () {
        let [min] = this.parent();
        return [min, min];
    },
});

function get_css_for_module (css_data, num) {
    let str = "";
    let background_color = css_data['title-background-color'];
    if (typeof background_color !== 'undefined') {
        str += Utils.object_to_css_string({'background-color': background_color},
            '.reader-card.variant' + num + ' .decorative-bar');
        delete css_data['title-background-color'];
    }
    str += Utils.get_css_for_title_and_module(css_data,
        '.reader-card.variant' + num + ' .title',
        '.reader-card.variant' + num + ' .attribution');
    return str;
}
