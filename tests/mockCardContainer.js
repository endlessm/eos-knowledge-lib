// Copyright (C) 2016 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Knowledge = imports.app.knowledge;
const StyleClasses = imports.app.styleClasses;

const MockCardContainer = new Knowledge.Class({
    Name: 'MockCardContainer',
    Extends: Gtk.Frame,
    Properties: {
        'grid': GObject.ParamSpec.object('grid', 'Grid', 'Grid',
            GObject.ParamFlags.READWRITE,
            GObject.Object.$gtype),
    },

    _init: function (props={}) {
        this.parent(props);
        this._grid = new Gtk.Grid();
        this.add(this._grid);
        this.get_style_context().add_class(StyleClasses.CARD_CONTAINER);
    },

    get grid() {
    	return this._grid;
    }
});
