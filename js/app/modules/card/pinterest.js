// Copyright 2015 Endless Mobile, Inc.

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const DynamicImage = imports.app.widgets.dynamicImage;
const Utils = imports.app.utils;
const {View} = imports.app.interfaces.view;

/**
 * Class: Pinterest
 */
const Pinterest = new Module.Class({
    Name: 'Card.Pinterest',
    Extends: Gtk.Box,
    Implements: [View, Card.Card],

    Template: 'resource:///com/endlessm/knowledge/data/widgets/card/pinterest.ui',
    InternalChildren: [ 'thumbnail'],

    _init: function (props={}) {
        this.parent(props);

        if (this.model.thumbnail_uri) {
            let file = Gio.File.new_for_uri(this.model.thumbnail_uri);
            let stream = file.read(null);
            this._thumbnail.set_content(stream);
        }

        Utils.set_hand_cursor_on_widget(this);
    },
});
