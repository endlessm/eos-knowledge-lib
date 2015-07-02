// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

/**
 * Class: SearchBox
 *
 * A search bar for querying information in the knowledge apps.
 */
const SearchBox = new Lang.Class({
    Name: 'SearchBox',
    GTypeName: 'EknSearchBox',
    Extends: Endless.SearchBox,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
    },

    _init: function (props={}) {
        this.parent(props);
    },
});
