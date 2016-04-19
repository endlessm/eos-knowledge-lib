// Copyright 2015 Endless Mobile, Inc.

/* exported TiledGridArrangement */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const Module = imports.app.interfaces.module;

const TiledGridArrangement = new Module.Class({
    Name: 'TiledGridArrangement',
    GTypeName: 'EknTiledGridArrangement',
    CssName: 'EknTiledGridArrangement',
    Extends: Gtk.Grid,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'all-visible': GObject.ParamSpec.override('all-visible', Arrangement.Arrangement),
        'fade-cards': GObject.ParamSpec.override('fade-cards', Arrangement.Arrangement),
        'spacing': GObject.ParamSpec.override('spacing', Arrangement.Arrangement),
    },

    _init: function (props={}) {
        this.parent(props);
        this.bind_property('spacing', this, 'column-spacing',
            GObject.BindingFlags.SYNC_CREATE);
        this.bind_property('spacing', this, 'row-spacing',
            GObject.BindingFlags.SYNC_CREATE);
    },

    // Arrangement override
    fade_card_in: function (card) {
        card.show_all();
    },

    // Arrangement override
    pack_card: function () {
        // FIXME: For now we're always showing two rows of cards.
        // An alternative would be to show 1 row for 4 cards, and 2 rows otherwise
        this.get_children().forEach(this.remove, this);
        // The card to be packed is already in this array:
        let cards = this.get_filtered_models()
            .map(this.get_card_for_model, this);

        let columns = Math.ceil(this.get_card_count() / 2);
        let i = 0;
        for (let card of cards) {
            let col = i % columns;
            let row = Math.floor(i / columns);
            this.attach(card, col, row, 1, 1);
            i++;
        }
    },
});
