// Copyright 2015 Endless Mobile, Inc.

/* exported Overflow */

const Arrangement = imports.framework.interfaces.arrangement;
const SpaceContainer = imports.framework.widgets.spaceContainer;
const Module = imports.framework.interfaces.module;

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

    /* Getters and setters copied from SpaceContainer so gjs can use them.
     * This is a workaround for gjs issue #306:
     * <https://gitlab.gnome.org/GNOME/gjs/issues/306>
     */

    get orientation() {
        return this._orientation;
    },

    set orientation(value) {
        if (this._orientation === value)
            return;
        this._orientation = value;
        this.notify('orientation');
        this.queue_resize();
    },
});
