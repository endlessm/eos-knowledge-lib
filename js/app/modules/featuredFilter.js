// Copyright (C) 2016 Endless Mobile, Inc.

/* exported FeaturedFilter */

const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;

const FeaturedFilter = new Module.Class({
    Name: 'FeaturedFilter',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    // Filter implementation
    include_impl: function (model) {
        return model.featured;
    },
});
