// Copyright 2016 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const Gtk = imports.gi.Gtk;
const Pango = imports.gi.Pango;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

/**
 * Class: LegacyPost
 *
 * A card implementation with sizing and styling specific to template B.
 * Will only show a title and image.
 */
const LegacyPost = new Module.Class({
    Name: 'Card.LegacyPost',
    Extends: Gtk.Button,
    Implements: [Card.Card],

    Template: 'resource:///com/endlessm/knowledge/data/widgets/card/legacyPost.ui',
    InternalChildren: [ 'thumbnail-frame', 'title-label' ],

    _init: function (props={}) {
        this.parent(props);
        Utils.set_hand_cursor_on_widget(this);

        this.set_title_label_from_model(this._title_label);
        this.set_thumbnail_frame_from_model(this._thumbnail_frame);

        if (Endless.is_composite_tv_screen(null)) {
            this._title_label.lines = 1;
            this._title_label.wrap = false;
            this._title_label.ellipsize = Pango.EllipsizeMode.END;
        }
    }
});
