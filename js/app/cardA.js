// Copyright 2014 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const MarginButton = imports.app.marginButton;
const Utils = imports.app.utils;

/**
 * Class: CardA
 *
 * A card implementation with sizing and styling specific to template A
 */
const CardA = new Lang.Class({
    Name: 'CardA',
    GTypeName: 'EknCardA',
    Extends: MarginButton.MarginButton,
    Implements: [ Card.Card ],

    Properties: {
        'css': GObject.ParamSpec.override('css', Card.Card),
        'fade-in': GObject.ParamSpec.override('fade-in', Card.Card),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/cardA.ui',
    Children: [ 'image-frame', 'title-label', 'synopsis-label' ],

    CARD_WIDTH: 183,
    CARD_HEIGHT: 209,
    CARD_MARGIN: 7,

    _init: function (props={}) {
        this.parent(props);
        this.populate_from_model();
        Utils.set_hand_cursor_on_widget(this);
    },

    // TODO: we do want all cards to be the same size, but we may want to make
    // this size scale with resolution down the road
    vfunc_get_preferred_width: function () {
        return [this.CARD_WIDTH + 2 * this.CARD_MARGIN, this.CARD_WIDTH + 2 * this.CARD_MARGIN];
    },

    vfunc_get_preferred_height: function () {
        return [this.CARD_HEIGHT + 2 * this.CARD_MARGIN, this.CARD_HEIGHT + 2 * this.CARD_MARGIN];
    },

    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.CONSTANT_SIZE;
    }
});
