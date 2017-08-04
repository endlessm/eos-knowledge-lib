// Copyright 2016 Endless Mobile, Inc.

/* exported Pinterest */

const Emeus = imports.gi.Emeus;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;

/**
 * Class: Pinterest
 */
const Pinterest = new Module.Class({
    Name: 'Arrangement.Pinterest',
    Extends: Emeus.ConstraintLayout,
    Implements: [Arrangement.Arrangement],

    _init: function (props) {
        this.parent(props);
        this.columns = 4;
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
        this.clear_constraints();
        let cards = this.get_children().map(child => child.get_child());
        cards.forEach((card, index) => this._setup_card(cards, card, index));
    },

    _setup_card: function (cards, card, index) {
        let top_card = this;
        let top_prop = Emeus.ConstraintAttribute.TOP;
        if (index >= this.columns) {
            top_card = cards[index - this.columns];
            top_prop = Emeus.ConstraintAttribute.BOTTOM;
        }

        let left_card = this;
        let left_prop = Emeus.ConstraintAttribute.LEFT;
        if (index % this.columns !== 0) {
             left_card = cards[index - 1];
             left_prop = Emeus.ConstraintAttribute.RIGHT;
        }

        let constraints = [
            {
                target_object: card,
                target_attribute: Emeus.ConstraintAttribute.TOP,
                source_object: top_card,
                source_attribute: top_prop,
                multiplier: 1.0,
                constant: 1.0,
            },
            {
                target_object: card,
                target_attribute: Emeus.ConstraintAttribute.LEFT,
                source_object: left_card,
                source_attribute: left_prop,
                multiplier: 1.0,
                constant: 1.0,
            },
            {
                target_object: card,
                target_attribute: Emeus.ConstraintAttribute.WIDTH,
                source_object: this,
                source_attribute: Emeus.ConstraintAttribute.WIDTH,
                multiplier: 1.0 / this.columns,
                constant: 1.0,
            },
        ];
        constraints.forEach(props => this.add_constraint(new Emeus.Constraint(props)));
    },


    vfunc_get_request_mode: function () {
        return Gtk.SizeRequestMode.HEIGHT_FOR_WIDTH;
    },

    vfunc_get_preferred_width: function () {
        let card_width = 100;
        let cards = this.get_children();
        if (cards.length > 0)
            card_width = cards[0].get_preferred_width()[0];
        print('width', this.columns * card_width);
        return [this.columns * card_width, this.columns * card_width];
    },

    vfunc_get_preferred_height_for_width: function (width) {
        let height = 0;
        let heights = [];
        this.get_children().forEach((child, index) => {
              let column = index % this.columns;
              if (!heights[column])
                  heights[column] = 0;

              let card_width = width / this.columns;
              let card_height = child.get_preferred_height_for_width(card_width)[0];
              heights[column] += card_height;

              if (heights[column] > height)
                  height = heights[column];
        });
        print('height', height);
        return [height, height];
    },
});
