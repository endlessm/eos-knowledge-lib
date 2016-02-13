// Copyright 2016 Endless Mobile, Inc.

/* exported FeaturedFilter */

const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;

const FeaturedFilter = new Lang.Class({
    Name: 'FeaturedFilter',
    GTypeName: 'EknFeaturedFilter',
    Extends: GObject.Object,
    Implements: [ Module.Module, Filter.Filter ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'invert': GObject.ParamSpec.override('invert', Filter.Filter),
    },

    // Filter implementation
    include_impl: function (model) {
        return model.featured;
    },
});
