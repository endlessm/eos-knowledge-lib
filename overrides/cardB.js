// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.card;


/**
 * Class: CardB
 *
 * A card subclass with sizing and styling specific to template B. Will only
 * show a title and image, ignore the synopsis property.
 */
const CardB = new Lang.Class({
    Name: 'CardB',
    GTypeName: 'EknCardB',
    Extends: Card.Card,

    _init: function(props) {
        props = props || {};
        props.expand = true;
        this.parent(props);

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_CARD_B);
    },

    pack_widgets: function () {
        this.title_label.valign = Gtk.Align.END;
        // Make title label "transparent" to mouse events
        this.title_label.connect_after('realize', function (frame) {
            let gdk_window = frame.get_window();
            gdk_window.set_child_input_shapes();
        });

        this.size_group = new Gtk.SizeGroup({
            mode: Gtk.SizeGroupMode.BOTH
        });
        this.size_group.add_widget(this.title_label);
        this.size_group.add_widget(this.image_frame);

        let overlay = new Gtk.Overlay();
        overlay.add(this.image_frame);
        overlay.add_overlay(this.title_label);

        this.add(overlay);
    }
});
