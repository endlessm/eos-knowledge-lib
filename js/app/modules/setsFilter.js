// Copyright 2016 Endless Mobile, Inc.

/* exported SetsFilter */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;

const SetsFilter = new Lang.Class({
    Name: 'SetsFilter',
    GTypeName: 'EknSetsFilter',
    Extends: GObject.Object,
    Implements: [ Module.Module, Filter.Filter ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'invert': GObject.ParamSpec.override('invert', Filter.Filter),
    },

    // Filter implementation
    include_impl: function (model) {
        return (model.tags.indexOf('EknSetObject') !== -1);
    },
});
