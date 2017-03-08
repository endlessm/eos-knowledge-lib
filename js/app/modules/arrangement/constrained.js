// Copyright 2016 Endless Mobile, Inc.

/* exported Constrained */

const Emeus = imports.gi.Emeus;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;

let _DEFAULT_CARD_COUNT = 10;
let _DEFAULT_COLUMNS = 1;
let _DEFAULT_ROWS = 10;
let _CARD_MIN_WIDTH = Card.MinSize.B;
let _CARD_MIN_HEIGHT = Card.MinSize.A;

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

    _setup_constraints: function () {
        // remove existing placeholders, if any
        let holders = this.get_children().filter(child => child.get_child() instanceof _Placeholder);
        holders.forEach(child => {
            let placeholder = child.get_child();
            this.unpack_card(placeholder);
        });

        /*

        // create widgets map with existing cards
        let widgets = {};
        let descriptions = [];
        let h_description = 'H:|';
        let h_loop_count = 0;
        let v_loop_count = 0;
        let v_col_0 = 'V:|';
        let v_col_1 = 'V:|';
        let v_col_2 = 'V:|';
        let v_col_3 = 'V:|';
        this.get_children().forEach((child, index) => {
            let name_current = 'view' + index;
            widgets[name_current] = child.get_child();

            // Add H constraints to VFL
            h_description += '[' + name_current + '(view0)' + ']';
            if (h_loop_count == 3) {
                h_description += '|';
                descriptions.push(h_description);
                h_description = 'H:|';
                h_loop_count = 0;
            } else {
                h_loop_count++;
            }


            // update V constraint
            // v_description += '[' + name_current + '(view0)' + ']';
            if (v_loop_count == 0) {
                v_col_0 += '[' + name_current + '(view0)' + ']';
                v_loop_count++;
            } 
            else if (v_loop_count == 1) {
                v_col_1 += '[' + name_current + '(view0)' + ']';
                v_loop_count++;
            } 
            else if (v_loop_count == 2) {
                v_col_2 += '[' + name_current + '(view0)' + ']';
                v_loop_count++;
            } 
            else if (v_loop_count == 3) {
                v_col_3 += '[' + name_current + '(view0)' + ']';
                v_loop_count = 0;
            }
        });
        v_col_0 += '|';
        v_col_1 += '|';
        v_col_2 += '|';
        v_col_3 += '|';
        descriptions.push(v_col_0, v_col_1, v_col_2, v_col_3);
        print(descriptions);


        // fill with placeholders in empty slots, if any
        let n_children = this.get_children().length;
        for (let index = n_children; index < n_children; index++) {
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

        */




        // clear existing constraits and re-create new ones
        this.clear_constraints();
        let n_children = this.get_children().length;
        let constraints = [];
        let v_constraint = {};
        let h_constraint = {};
        for (let i = 0; i < n_children; i++) {
            if (i === 0) {
                let v_constraint = {
                    target_object: this.get_children()[i],
                    target_attribute: Emeus.ConstraintAttribute.START,
                    source_object: this,
                    source_attribute: Emeus.ConstraintAttribute.START,
                }
            }
            else {
                let v_constraint = {
                    target_object: this.get_children()[i],
                    target_attribute: Emeus.ConstraintAttribute.START,
                    source_object: this.get_children()[i-1],
                    source_attribute: Emeus.ConstraintAttribute.END,
                };
            }
            let h_constraint = {
                target_object: this.get_children()[i],
                target_attribute: Emeus.ConstraintAttribute.WIDTH,
                source_attribute: Emeus.ConstraintAttribute.WIDTH,
            }
            constraints.push(v_constraint, h_constraint);
        }
        constraints.forEach(this.add_constraint, this);


        // fill with placeholders in empty slots, if any
        for (let index = n_children; index < n_children; index++) {
            let holder = new _Placeholder();
            this.add(holder);
        }
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
