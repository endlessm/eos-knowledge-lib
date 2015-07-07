// Copyright 2014 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;
const Utils = imports.app.utils;

/**
 * Class: DocumentCard
 *
 * A card implementation for showing entire documents of content.
 */
const DocumentCard = new Lang.Class({
    Name: 'DocumentCard',
    GTypeName: 'EknDocumentCard',
    Extends: Gtk.Frame,
    Implements: [ Card.Card ],

    Properties: {
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/documentCard.ui',
    Children: [ 'toc' ],

    _init: function (props={}) {
        this.parent(props);
        this.populate_from_model();
    },
});
