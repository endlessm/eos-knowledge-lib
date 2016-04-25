// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: LegacyPostCard
 *
 * A card implementation with sizing and styling specific to template B.
 * Will only show a title and image.
 */
const LegacyPostCard = new Module.Class({
    Name: 'LegacyPostCard',
    CssName: 'EknLegacyPostCard',
    Extends: Gtk.Button,
    Implements: [Card.Card],

    Template: 'resource:///com/endlessm/knowledge/data/widgets/legacyPostCard.ui',
    InternalChildren: [ 'thumbnail-frame', 'title-label' ],

    _init: function (props={}) {
        this.parent(props);
        Utils.set_hand_cursor_on_widget(this);

        this.set_title_label_from_model(this._title_label);
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);
    }
});
