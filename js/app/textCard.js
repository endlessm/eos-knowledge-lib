// Copyright 2014 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const Utils = imports.app.utils;

/**
 * Class: TextCard
 *
 * Class to show text-only cards in the knowledge lib UI
 *
 * This widget displays a clickable topic to the user.
 * Connect to the <clicked> signal to perform an action
 * when the user clicks on the card.
 */
const TextCard = new Lang.Class({
    Name: 'TextCard',
    GTypeName: 'EknTextCard',
    Extends: Gtk.Button,
    Implements: [ Card.Card ],

    Properties: {
        'css': GObject.ParamSpec.override('css', Card.Card),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/textCard.ui',
    Children: [ 'title-label' ],

    _init: function (params={}) {
        this.parent(params);
        this.populate_from_model(this.model);
        Utils.set_hand_cursor_on_widget(this);
    },
});
