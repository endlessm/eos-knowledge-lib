// Copyright 2015 Endless Mobile, Inc.

/* exported Overflow */

const Arrangement = imports.app.interfaces.arrangement;
const SpaceContainer = imports.app.widgets.spaceContainer;
const Module = imports.app.interfaces.module;

var Overflow = new Module.Class({
    Name: 'Arrangement.Overflow',
    Extends: SpaceContainer.SpaceContainer,
    Implements: [Arrangement.Arrangement],

    // Arrangement override
    fade_card_in: function (card) {
        card.show_all();
    },

    pack_card: function (card, position=-1) {
        if (position === -1)
            this.add(card);
        else
            this.insert(card, position);
    },
});
