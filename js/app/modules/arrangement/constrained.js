// Copyright 2016 Endless Mobile, Inc.

/* exported Constrained */

const Emeus = imports.gi.Emeus;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;

const _DEFAULT_CARD_COUNT = 10;
const _DEFAULT_COLUMNS = 1;
const _DEFAULT_ROWS = 10;
const _CARD_MIN_WIDTH = Card.MinSize.B;
const _CARD_MIN_HEIGHT = Card.MinSize.C;

const _Placeholder = new Lang.Class({
    Name: 'Placeholder',
    Extends: Gtk.Frame,
});

/**
 * Class: Constrained
 * Arrangement with featured cards on a irregular pattern
 *
 * This arrangement shows featured cards that follow a irregular pattern
 * in three different card sizes. The pattern is described using Emeus
 * VFL (Visual Format Language).
 *
 * NOTE that this arrangement design is still experimental therefore it
 * visuals and behavior are subject to change.
 *
 * This arrangement can be extended by programmers to implement other
 * constrained arrangements by simply providing a VFL description and
 * the number of cards.
 *
 * To extend this class override the Arrangement.get_max_cards() and
 * Constrained.get_description().
 */
const Constrained = new Module.Class({
    Name: 'Arrangement.Constrained',
    Extends: Emeus.ConstraintLayout,
    Implements: [Arrangement.Arrangement],

    // Arrangement override
    // get_max_cards: function () {
    //     return _DEFAULT_CARD_COUNT;
    // },

    // Arrangement override
    set_models: function (models) {
        Arrangement.Arrangement.set_models(this, models);
        this._setup_constraints();
    },

    // Arrangement override
    unpack_card: function (card) {
        let child = card.get_parent();
        child.remove(card);
        this.remove(child);
    },

    _setup_constraints: function () {
        // remove existing placeholders, if any
        let holders = this.get_children().filter(child => child.get_child() instanceof _Placeholder);
        holders.forEach(child => {
            let placeholder = child.get_child();
            this.unpack_card(placeholder);
        });

        // create widgets map with existing cards
        let widgets = {};
        let descriptions = [];
        let h_description = '';
        let v_description = 'V:|';
        this.get_children().forEach((child, index) => {
            let name_current = 'view' + index;
            widgets[name_current] = child.get_child();

            // add H description
            h_description = 'H:|[' + name_current + '(view0)]|';
            descriptions.push(h_description);

            // add V description
            v_description += '[' + name_current + '(view0)]';
        });
        v_description += '|';
        descriptions.push(v_description);

        // fill arrangement with placeholders in empty slots, if any
        let n_children = this.get_children().length;
        for (let index = n_children; index < _DEFAULT_CARD_COUNT; index++) {
                let holder = new _Placeholder();
                widgets['view' + index] = holder;
                this.add(holder);
        }

        // clear existing constraints and re-create new ones
        this.clear_constraints();
        let constraints = Emeus.create_constraints_from_description(
            descriptions,
            0, 0,
            widgets,
            {});
        constraints.forEach(this.add_constraint, this);
    },


    // XXX workaround for minimum size issues in Emeus
    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.CONSTANT_SIZE;
    },

    vfunc_get_preferred_width: function () {
        return [_CARD_MIN_WIDTH * _DEFAULT_COLUMNS, _CARD_MIN_WIDTH * _DEFAULT_COLUMNS];
    },

    vfunc_get_preferred_height: function () {
        return [_CARD_MIN_HEIGHT * this.get_children().length, _CARD_MIN_HEIGHT * this.get_children().length];
    },
});
