// Copyright 2014 Endless Mobile, Inc.

const Endless = imports.gi.Endless;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;
const StyleClasses = imports.app.styleClasses;

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
        if (props.visible === undefined)
            props.visible = true;
        this.parent(props);
        this.get_style_context().add_class(StyleClasses.SEARCH_BOX);
    },
});
