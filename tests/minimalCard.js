const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Card = imports.app.interfaces.card;

const MinimalCard = new Lang.Class({
    Name: 'MinimalCard',
    Extends: Gtk.Label,
    Implements: [ Card.Card ],
    Properties: {
        'css': GObject.ParamSpec.override('css', Card.Card),
        'model': GObject.ParamSpec.override('model', Card.Card),
        'title-capitalization': GObject.ParamSpec.override('title-capitalization',
            Card.Card),
    },

    _init: function (props={}) {
        this.parent(props);
        this.populate_from_model();
    }
});
