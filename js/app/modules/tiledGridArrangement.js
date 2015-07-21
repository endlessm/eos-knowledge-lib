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
        'count': GObject.ParamSpec.override('count', Arrangement.Arrangement),
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        this._cards = [];
        this.parent(props);
    },

    get count() {
        return this._cards.length;
    },

    add_card: function (widget) {
        // FIXME: For now we're always showing two rows of cards.
        // An alternative would be to show 1 row for 4 cards, and 2 rows otherwise
        this._cards.forEach(this.remove, this);
        this._cards.push(widget);

        let columns = this._cards.length / 2;
        let i = 0;
        for (let card of this._cards) {
            let col = i % columns;
            let row = Math.floor(i / columns);
            this.attach(card, col, row, 1, 1);
            i++;
        }
    },

    clear: function () {
        this._cards.forEach(this.remove, this);
        this._cards = [];
    },
});
