// Copyright 2015 Endless Mobile, Inc.

const Lang = imports.lang;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Card = imports.app.interfaces.card;
const Module = imports.app.interfaces.module;

/**
 * Class: SetBanner
 * Widget to display a section banner in any of the app's pages.
 *
 * CSS classes:
 *   set-banner - on the widget itself.
 */
const SetBanner = new Lang.Class({
    Name: 'SetBanner',
    GTypeName: 'EknSetBanner',
    Extends: Gtk.Button,
    Implements: [ Module.Module, Card.Card ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/setBanner.ui',
    Children: [ 'title-label' ],

    _init: function (props={}) {
        this.parent(props);
        this.populate_from_model();
    },
});
