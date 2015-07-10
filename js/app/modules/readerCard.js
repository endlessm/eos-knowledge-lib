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
 *    reader-card0 - Style variant #0
 *    reader-card1 - Style variant #1
 *    reader-card2 - Style variant #2
 */
const ReaderCard = new Lang.Class({
    Name: 'ReaderCard',
    GTypeName: 'EknReaderCard',
    Extends: Gtk.Button,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'page-number': GObject.ParamSpec.override('page-number', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
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

        // page_number of 0 means an archived article
        if (this.page_number) {
            this._card_info_label.label = (_("Page %s").format('<b>' + this.page_number + '</b>'));
            this._card_info_grid.remove(this._archive_icon);
        }

        this.connect('enter-notify-event', () => {
            this._hover_frame.show();
        });

        this.connect('leave-notify-event', () => {
            this._hover_frame.hide();
        });

        if (this.model.article_number !== undefined) {
            let style = this.model.article_number % 3;
            this.get_style_context().add_class('reader-card' + style);
        }
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
