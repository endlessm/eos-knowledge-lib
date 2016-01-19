// Copyright 2015 Endless Mobile, Inc.

/* exported CarouselArrangement */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const Module = imports.app.interfaces.module;

const CarouselArrangement = new Lang.Class({
    Name: 'CarouselArrangement',
    GTypeName: 'EknCarouselArrangement',
    Extends: Gtk.Stack,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'all-visible': GObject.ParamSpec.override('all-visible', Arrangement.Arrangement),
        'spacing': GObject.ParamSpec.override('spacing',
            Arrangement.Arrangement),  // spacing is ignored
    },

    _init: function (props={}) {
        this.parent(props);
    },

    // Arrangement implementation
    add_card: function (widget) {
        this.add(widget);
    },

    // Arrangement implementation
    get_cards: function () {
        return this.get_children();
    },

    // Arrangement implementation
    clear: function () {
        let children = this.get_children();
        children.forEach((child) => this.remove(child));
    },
});
