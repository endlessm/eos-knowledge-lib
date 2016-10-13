// Copyright 2016 Endless Mobile, Inc.

/* exported Accordion */

const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const Module = imports.app.interfaces.module;

const TRANSITION_DURATION = 500;

/**
 * Class: Accordion
 * Arrangement which puts its cards into an accordion-like widget.
 * Each segment of the accordion has a title, which is always visible,
 * and a revealer, in which lives the actual card. Clicking on the title
 * expands the corresponding revealer.
 */
const Accordion = new Module.Class({
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
        let label = new Gtk.Button({
            label: card.model.title,
        });

        let revealer = new Gtk.Revealer({
            transition_duration: TRANSITION_DURATION,
            transition_type: Gtk.RevealerTransitionType.SLIDE_UP,
        });
        revealer.add(card);

        label.connect('clicked', () => {
            revealer.reveal_child = !revealer.child_revealed;
        });
        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
        });
        grid.add(label);
        grid.add(revealer);
        grid.show_all();
        this.add(grid);
    },

    // Arrangement override
    unpack_card: function (card) {
        for (let i = 0; i < this.get_children().length; i++) {
            let revealer = this.get_children()[i].get_children()[0];
            let card_of_revealer = revealer.get_child();
            if (card.model.ekn_id === card_of_revealer.model.ekn_id) {
                revealer.remove(card_of_revealer);
                this.remove(this.get_children()[i]);
                break;
            }
        }
    },
});
