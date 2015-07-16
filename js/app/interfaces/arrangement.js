// Copyright 2015 Endless Mobile, Inc.

/* exported Arrangement */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Interface: Arrangement
 * Arrangement and order of cards in a container
 *
 * An arrangement controls how a group of cards are presented in the UI.
 * Examples of arrangements: a list, a grid, etc.
 */
const Arrangement = new Lang.Interface({
    Name: 'Arrangement',
    GTypeName: 'EknArrangement',
    Requires: [ Gtk.Widget, Module.Module ],

    Properties: {
        'count': GObject.ParamSpec.uint('count', 'Count',
            'Number of cards in the arrangement',
            GObject.ParamFlags.READABLE,
            0, GLib.MAXINT32, 0),
    },

    /**
     * Method: add_card
     * Add a card to the arrangement
     *
     * Parameters:
     *   card - a <Card> implementation
     */
    add_card: Lang.Interface.UNIMPLEMENTED,

    /**
     * Method: clear
     * Remove all cards from the arrangement
     */
    clear: Lang.Interface.UNIMPLEMENTED,
});
