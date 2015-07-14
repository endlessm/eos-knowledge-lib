// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Class: CardContainer
 *
 * This module acts as a grid which contains other cards.
 *
 */
const CardContainer = new Lang.Class({
    Name: 'CardContainer',
    GTypeName: 'EknCardContainer',
    Extends: Gtk.Grid,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/cardContainer.ui',

    _init: function (props) {
        this.parent(props);
    },
});
