// Copyright 2016 Endless Mobile, Inc.

/* exported Constrained */

const Emeus = imports.gi.Emeus;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;

const _DEFAULT_CARD_COUNT = 10;
const _DEFAULT_COLUMNS = 5;
const _DEFAULT_ROWS = 6;
const _CARD_MIN_WIDTH = Card.MinSize.B;
const _CARD_MIN_HEIGHT = Card.MinSize.B;

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
    get_max_cards: function () {
        return _DEFAULT_CARD_COUNT;
    },

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

    /**
     * Method: get_description
     * Get Emeus VFL description for this arrangement.
     */
    get_description: function () {
        return [
            'H:|[view0(view4 * 3)][view1(view4 * 2)]|',
            'H:|[view0][view2(view4 * 2)]|',
            'H:|[view3(view4 * 2)][view4][view2]|',
            'H:|[view3][view5(view4 * 2)][view6(view4)]|',
            'H:|[view8(view4)][view9(view4)][view5][view7(view4)]|',
            'V:|[view0(view4 * 3)][view3(view4 * 2)][view8(view4)]|',
            'V:[view3][view9(view4)]|',
            'V:|[view0][view4][view5(view4 * 2)]|',
            'V:|[view1(view4 * 2)][view2(view4 * 2)][view6(view4)][view7(view4)]|',
        ];
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
        this.get_children().forEach((child, index) => {
            widgets['view' + index] = child.get_child();
        });

        // fill with placeholders in empty slots, if any
        let n_children = this.get_children().length;
        for (let index = n_children; index < this.get_max_cards(); index++) {
                let holder = new _Placeholder();
                widgets['view' + index] = holder;
                this.add(holder);
        }

        // clear existing constraints and re-create new ones
        this.clear_constraints();
        let constraints = Emeus.create_constraints_from_description(
            this.get_description(),
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
        return [_CARD_MIN_HEIGHT * _DEFAULT_ROWS, _CARD_MIN_HEIGHT * _DEFAULT_ROWS];
    },
});
