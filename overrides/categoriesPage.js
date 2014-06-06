// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;


/**
 * Class: CategoriesPage
 *
 * This represents the categories page for template A of the knowledge apps.
 * It displays a grid of cards representing all categories for this app.
 *
 */
const CategoriesPage = new Lang.Class({
    Name: 'CategoriesPage',
    GTypeName: 'EknCategoriesPage',
    Extends:Gtk.ScrolledWindow,

    _init: function (props) {
        props = props || {};
        props.hscrollbar_policy = Gtk.PolicyType.NEVER;

        this._card_grid = new Gtk.FlowBox({
            valign: Gtk.Align.START,
            row_spacing: 20,
            margin: 40
        });

        this._cards = null;

        this.parent(props);

        this.add(this._card_grid);
        this.show_all();
    },

    set cards (v) {
        if (this._cards === v)
            return;
        if (this._cards !== null) {
            for (let card of this._cards) {
               this._card_grid.remove(card);
            }
        }
        this._cards = v;
        if (this._cards !== null) {
            for (let card of this._cards) {
                this._card_grid.add(card);
            }
        }
    },

    get cards () {
        return this._cards;
    }
});
