// Copyright 2016 Endless Mobile, Inc.

/* exported SetsFilter */

const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;

const SetsFilter = new Module.Class({
    Name: 'SetsFilter',
    GTypeName: 'EknSetsFilter',
    Extends: GObject.Object,
    Implements: [ Module.Module, Filter.Filter ],

    // Filter implementation
    include_impl: function (model) {
        return (model.tags.indexOf('EknSetObject') !== -1);
    },
});
