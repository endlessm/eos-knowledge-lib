// Copyright 2015 Endless Mobile, Inc.

/* exported OverflowArrangement */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const SpaceContainer = imports.app.widgets.spaceContainer;
const Module = imports.app.interfaces.module;

const OverflowArrangement = new Lang.Class({
    Name: 'OverflowArrangement',
    GTypeName: 'EknOverflowArrangement',
    Extends: SpaceContainer.SpaceContainer,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        this.parent(props);
    },

    add_card: function (widget) {
        this.add(widget);
    },

    get_cards: function () {
        return this.get_children();
    },

    clear: function () {
        this.get_children().forEach((child) => this.remove(child));
    },
});
