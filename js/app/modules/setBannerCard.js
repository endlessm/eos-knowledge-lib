// Copyright 2015 Endless Mobile, Inc.

const Lang = imports.lang;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;

/**
 * Class: SetBannerCard
 * Widget to display a section banner in any of the app's pages.
 */
const SetBannerCard = new Lang.Class({
    Name: 'SetBannerCard',
    GTypeName: 'EknSetBannerCard',
    Extends: Gtk.Button,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/setBannerCard.ui',
    Children: [ 'title-label' ],

    _init: function (props={}) {
        this.parent(props);
        this.populate_from_model();
    },
});
