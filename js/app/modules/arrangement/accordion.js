// Copyright 2016 Endless Mobile, Inc.

/* exported Accordion */

const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const Module = imports.app.interfaces.module;
const Utils = imports.app.utils;

const TRANSITION_DURATION = 500;

/**
 * Class: Accordion
 * Arrangement which puts its cards into an accordion-like widget.
 * Each segment of the accordion has a title, which is always visible,
 * and a revealer, in which lives the actual card. Clicking on the title
 * expands the corresponding revealer.
 */
var Accordion = new Module.Class({
    Name: 'Arrangement.Accordion',
    Extends: Gtk.Grid,
    Implements: [Arrangement.Arrangement],

    _init: function (props={}) {
        props.orientation = Gtk.Orientation.VERTICAL;
        props.valign = Gtk.Align.START;
        this.parent(props);
    },

    // Arrangement override
    pack_card: function (card) {
        let button = new Gtk.Button({
            hexpand: true,
        });
        let label = new Gtk.Label({
            label: card.model.title,
            halign: Gtk.Align.START,
        });
        button.add(label);
        button.get_style_context().add_class(Utils.get_element_style_class(Accordion, 'title'));

        let is_first = this.get_children().length === 0;
        let revealer = new Gtk.Revealer({
            transition_duration: TRANSITION_DURATION,
            transition_type: Gtk.RevealerTransitionType.SLIDE_UP,
            reveal_child: is_first,
        });
        revealer.add(card);

        button.connect('clicked', () => {
            revealer.reveal_child = !revealer.child_revealed;
        });
        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
        });
        grid.add(button);
        grid.add(revealer);
        grid.show_all();
        this.add(grid);
    },

    // Arrangement override
    unpack_card: function (card) {
        for (let i = 0; i < this.get_children().length; i++) {
            let revealer = this.get_children()[i].get_children()[0];
            let card_of_revealer = revealer.get_child();
            if (card.model.id === card_of_revealer.model.id) {
                revealer.remove(card_of_revealer);
                this.remove(this.get_children()[i]);
                break;
            }
        }
    },
});
