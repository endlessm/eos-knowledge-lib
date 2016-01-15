// Copyright 2015 Endless Mobile, Inc.

/* exported TiledGridArrangement */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Module = imports.app.interfaces.module;

const TiledGridArrangement = new Lang.Class({
    Name: 'TiledGridArrangement',
    GTypeName: 'EknTiledGridArrangement',
    Extends: Gtk.Grid,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'all-visible': GObject.ParamSpec.override('all-visible', Arrangement.Arrangement),
        'spacing': GObject.ParamSpec.override('spacing', Arrangement.Arrangement),
    },

    _init: function (props={}) {
        this._cards = [];
        this.parent(props);
        this.bind_property('spacing', this, 'column-spacing',
            GObject.BindingFlags.SYNC_CREATE);
        this.bind_property('spacing', this, 'row-spacing',
            GObject.BindingFlags.SYNC_CREATE);
    },

    vfunc_remove: function (widget) {
        this.parent(widget);
        this._cards.splice(this._cards.indexOf(widget), 1);
    },

    add_card: function (widget) {
        // FIXME: For now we're always showing two rows of cards.
        // An alternative would be to show 1 row for 4 cards, and 2 rows otherwise
        let cards = this._cards.slice();
        cards.forEach(this.remove, this);
        this._cards = cards;
        this._cards.push(widget);

        let columns = Math.ceil(this._cards.length / 2);
        let i = 0;
        for (let card of this._cards) {
            let col = i % columns;
            let row = Math.floor(i / columns);
            this.attach(card, col, row, 1, 1);
            i++;
        }
    },

    get_cards: function () {
        return this._cards;
    },

    clear: function () {
        let cards = this._cards.slice();
        cards.forEach(this.remove, this);
    },
});
