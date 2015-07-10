// Copyright 2014 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: CardB
 *
 * A card implementation with sizing and styling specific to template B.
 * Will only show a title and image.
 */
const CardB = new Lang.Class({
    Name: 'CardB',
    GTypeName: 'EknCardB',
    Extends: Gtk.Button,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'page-number': GObject.ParamSpec.override('page-number', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/cardB.ui',
    Children: [ 'thumbnail-frame', 'title-label' ],

    _init: function (props={}) {
        this.parent(props);
        this.populate_from_model();
        Utils.set_hand_cursor_on_widget(this);
    }
});
