// Copyright 2014 Endless Mobile, Inc.

const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;
const NavigationCard = imports.app.interfaces.navigationCard;
// Make sure included for glade template
const ThemeableImage = imports.app.widgets.themeableImage;
const Utils = imports.app.utils;
const {View} = imports.app.interfaces.view;

/**
 * Class: Title
 *
 * Class to show text-only cards in the knowledge lib UI
 *
 * This widget displays a clickable topic to the user.
 * Connect to the <clicked> signal to perform an action
 * when the user clicks on the card.
 *
 * Style classes:
 *   card, title-card - on the widget itself
 *   title - on the title label
 */
var Title = new Module.Class({
    Name: 'Card.Title',
    Extends: Gtk.Button,
    Implements: [View, Card.Card, NavigationCard.NavigationCard],

    Properties: {
        /**
         * Property: max-title-lines
         *
         * The maximum numer of lines that the title label can wrap (given that
         * it is ellipsizing and wrapping)
         *
         * A value of -1 allows unlimited number of lines.
         */
        'max-title-lines': GObject.ParamSpec.int('max-title-lines', 'Max Title Lines',
            'The maximum number of lines that the title label can wrap (given that it is ellipsizing and wrapping)',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            -1, GLib.MAXINT32, 1),
    },

    Template: 'resource:///com/endlessm/knowledge/data/widgets/card/title.ui',
    InternalChildren: [ 'title-label' ],

    _init: function (params={}) {
        this.parent(params);

        Utils.set_hand_cursor_on_widget(this);
        this.set_title_label_from_model(this._title_label);
        this._title_label_text = this._title_label.label;

        this._title_label.lines = this.max_title_lines;
    },
});
