// Copyright 2016 Endless Mobile, Inc.

/* exported SideBySide */

const Endless = imports.gi.Endless;
const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Arrangement = imports.framework.interfaces.arrangement;
const Knowledge = imports.framework.knowledge;
const Module = imports.framework.interfaces.module;
const Utils = imports.framework.utils;

/**
 * Class: SideBySide
 * Arrangement to be used in horizontal menus
 *
 * This arrangement presents cards in a horizontal layout, and is intended to
 * display menu items.
 */
var SideBySide = new Module.Class({
    Name: 'Arrangement.SideBySide',
    Extends: Endless.CustomContainer,
    Implements: [Arrangement.Arrangement],

    _init: function (props={}) {
        this.all_visible = true;

        this.parent(props);

        /* Button to trigger dropdown */
        this._popover_button = new Gtk.Button({
            no_show_all: true,
            visible: true,
            label: " ⁝ ",
        });
        Utils.set_hand_cursor_on_widget(this._popover_button);
        this.add (this._popover_button);

        /* Used for dropdown menu if cards do not fit */
        this._popover = new Gtk.Popover({
            position: Gtk.PositionType.BOTTOM,
            relative_to: this._popover_button.get_child(),
        });
        this._popover_button.connect("clicked", () => {
            this._popover.popup();
        });
        this._popover_button.get_style_context().add_class(Utils.get_element_style_class(SideBySide, 'dropdown_button'));

        /* Classes needed for cards to have the same style */
        let context = this._popover.get_style_context();
        context.add_class(Utils.get_element_style_class(SideBySide, 'dropdown_menu'));
        context.add_class(SideBySide.get_style_class());

        /* Dropdown contents */
        let scroll = new Gtk.ScrolledWindow({
            visible: true,
            hscrollbar_policy: Gtk.PolicyType.NEVER,
            propagate_natural_width: true,
            propagate_natural_height: true,
            max_content_height: 400,
        });
        this._popover_box = new Gtk.Box({
            visible: true,
            orientation: Gtk.Orientation.VERTICAL,
        });
        scroll.add(this._popover_box);
        this._popover.add(scroll);
    },

    vfunc_get_preferred_height: function () {
        let all_cards = this.get_cards();
        if (all_cards.length === 0)
            return [0, 0];

        return all_cards[0].get_preferred_height();
    },

    vfunc_get_preferred_width: function () {
        let all_cards = this.get_cards();
        if (all_cards.length === 0)
            return [0, 0];

        let [, first_nat] = all_cards[0].get_preferred_width();
        let [, button_nat] = this._popover_button.get_preferred_width();

        let min = first_nat + button_nat;
        let nat = first_nat;

        nat += all_cards.slice(1).reduce((accum, card) => {
            let [, card_nat] = card.get_preferred_width();
            return accum + card_nat;
        }, 0);

        return [min, nat];
    },

    _ensure_card_parent: function (card, parent) {
        let current_parent = card.get_parent();

        if (current_parent !== parent) {
            /* No need to add a reference sin GJS holds one for us */
            current_parent.remove(card);
            parent.add(card);
        }
    },

    vfunc_size_allocate: function (alloc) {
        let all_cards = this.get_cards();
        let n_cards = all_cards.length;

        this.all_visible = true;

        if (n_cards === 0)
            return;

        let [, button_nat] = this._popover_button.get_preferred_width();
        /* Use cache value if button_nat is 0 (_popover_button is not visible) */
        this._button_nat = button_nat || this._button_nat;

        let width = alloc.width;
        let cards_width = 0;
        let visible = [];
        let i = 1;

        /* Find how many cards we can fit in width */
        all_cards.forEach ((card) => {
            let [, card_nat] = card.get_preferred_width();

            if (this.all_visible &&
                width >= cards_width + card_nat + ((i < n_cards) ? this._button_nat : 0)) {
                cards_width += card_nat;
                this._ensure_card_parent(card, this);
                visible.push({ child: card, nat: card_nat });
            }
            else  {
                this._ensure_card_parent(card, this._popover_box);
                card.show();
                this._popover_box.reorder_child(card, i);
                this.all_visible = false;
            }
            i++;
        });

        if (this.all_visible) {
            this._popover_button.set_child_visible(false);
        } else {
            visible.push({ child: this._popover_button, nat: this._button_nat });
            cards_width += this._button_nat;
        }

        /* Allocate children */
        let x = alloc.x + (width - cards_width);
        let y = alloc.y;

        visible.forEach ((child) => {
            Arrangement.place_card(child.child, x, y, child.nat, alloc.height);
            x += child.nat;
        });

        this.parent(alloc);
    },

});
