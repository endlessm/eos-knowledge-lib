// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Card = imports.card;

/**
 * Class: TextCard
 *
 * Class to show text-only cards in the knowledge lib UI
 *
 * This widget displays a clickable topic to the user.
 * Connect to the <clicked> signal to perform an action
 * when the user clicks on the card.
 */

/**
 * Event: clicked
 * Signal generated when user clicked the card.
 * > card.connect("clicked", function (widget) { print("Clicked!"); });
 */
const TextCard = new Lang.Class({
    Name: 'TextCard',
    GTypeName: 'EknTextCard',
    Extends: Card.Card,

    _init: function(params) {
        params = params || {};
        params.hexpand = true;
        this.parent(params);

        this.title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_TEXT_CARD);
    },

    pack_widgets: function () {
        this.title_label.valign = Gtk.Align.END;

        let _spacer = new Gtk.Label();

        let grid = new Gtk.Grid();
        grid.attach(this.title_label, 0, 0, 1, 1);
        grid.attach(_spacer, 0, 1, 1, 1);

        this.add(grid);
    }
});
