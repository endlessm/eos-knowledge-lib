// Copyright 2014 Endless Mobile, Inc.

/* global private_imports */

const EosKnowledge = imports.gi.EosKnowledge;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = private_imports.card;

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

    pack_widgets: function (title_label, synopsis_label, image_frame) {
        title_label.lines = 1;
        title_label.valign = Gtk.Align.END;
        // Make title label "transparent" to mouse events
        title_label.connect_after('realize', function (widget) {
            let gdk_window = widget.get_window();
            gdk_window.set_child_input_shapes();
        });

        // I think we need to ref the size group somehow, so its lifetime is
        // attached to this widget, hence the "this."
        this._size_group = new Gtk.SizeGroup({
            mode: Gtk.SizeGroupMode.BOTH
        });
        this._size_group.add_widget(title_label);
        this._size_group.add_widget(image_frame);

        let overlay = new Gtk.Overlay();
        overlay.add(image_frame);
        overlay.add_overlay(title_label);

        this.add(overlay);
    }
});
