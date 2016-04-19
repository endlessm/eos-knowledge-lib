// Copyright 2015 Endless Mobile, Inc.

/* exported OverflowArrangement */

const GObject = imports.gi.GObject;

const Arrangement = imports.app.interfaces.arrangement;
const SpaceContainer = imports.app.widgets.spaceContainer;
const Module = imports.app.interfaces.module;

const OverflowArrangement = new Module.Class({
    Name: 'OverflowArrangement',
    GTypeName: 'EknOverflowArrangement',
    CssName: 'EknOverflowArrangement',
    Extends: SpaceContainer.SpaceContainer,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'all-visible': GObject.ParamSpec.override('all-visible', Arrangement.Arrangement),
        'fade-cards': GObject.ParamSpec.override('fade-cards', Arrangement.Arrangement),
        // 'spacing' already implemented by SpaceContainer
    },

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
