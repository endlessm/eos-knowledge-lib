// Copyright 2015 Endless Mobile, Inc.

/* exported CarouselArrangement */

const Gtk = imports.gi.Gtk;

const Arrangement = imports.app.interfaces.arrangement;
const Module = imports.app.interfaces.module;

const CarouselArrangement = new Module.Class({
    Name: 'CarouselArrangement',
    GTypeName: 'EknCarouselArrangement',
    CssName: 'EknCarouselArrangement',
    Extends: Gtk.Stack,
    Implements: [Arrangement.Arrangement],

    // Arrangement override
    fade_card_in: function (card) {
        card.show_all();
    },

    // FIXME: Order is ignored in this arrangement for now, because a stack
    // effectively has no inherent ordering of pages. (Instead, we set the
    // visible child directly.) If we added UI controls to this module for
    // flipping through the pages in order, then we'd have to start paying
    // attention to the order of cards.
});
