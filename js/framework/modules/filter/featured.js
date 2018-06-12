// Copyright 2016 Endless Mobile, Inc.

/* exported Featured */

const GObject = imports.gi.GObject;

const Filter = imports.framework.interfaces.filter;
const Module = imports.framework.interfaces.module;

var Featured = new Module.Class({
    Name: 'Filter.Featured',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    // Filter implementation
    include_impl: function (model) {
        return model.featured;
    },
});
