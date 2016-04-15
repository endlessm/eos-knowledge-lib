// Copyright 2014 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: CardB
 *
 * A card implementation with sizing and styling specific to template B.
 * Will only show a title and image.
 */
const CardB = new Module.Class({
    Name: 'CardB',
    GTypeName: 'EknCardB',
    CssName: 'EknCardB',
    Extends: Gtk.Button,
    Implements: [ Module.Module, Card.Card ],

    Template: 'resource:///com/endlessm/knowledge/data/widgets/cardB.ui',
    InternalChildren: [ 'thumbnail-frame', 'title-label' ],

    _init: function (props={}) {
        this.parent(props);
        Utils.set_hand_cursor_on_widget(this);

        this.set_title_label_from_model(this._title_label);
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);
    }
});
