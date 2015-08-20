// Copyright 2015 Endless Mobile, Inc.

/* exported GridArrangement */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Arrangement = imports.app.interfaces.arrangement;
const InfiniteScrolledWindow = imports.app.widgets.infiniteScrolledWindow;
const Module = imports.app.interfaces.module;

const GridArrangement = new Lang.Class({
    Name: 'GridArrangement',
    GTypeName: 'EknGridArrangement',
    Extends: InfiniteScrolledWindow.InfiniteScrolledWindow,
    Implements: [ Module.Module, Arrangement.Arrangement ],

    Properties: {
        'count': GObject.ParamSpec.override('count', Arrangement.Arrangement),
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    Template: 'resource:///com/endlessm/knowledge/widgets/gridArrangement.ui',
    InternalChildren: [ 'flow_box' ],

    _init: function (props={}) {
        this.parent(props);
    },

    get count() {
        return this._flow_box.get_children().length;
    },

    add_card: function (widget) {
        this._flow_box.add(widget);
    },

    clear: function () {
        let children = this._flow_box.get_children();
        children.forEach((child) => this._flow_box.remove(child));
    },
});
