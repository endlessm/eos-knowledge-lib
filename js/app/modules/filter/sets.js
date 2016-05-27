// Copyright 2016 Endless Mobile, Inc.

/* exported Sets */

const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;

const Sets = new Module.Class({
    Name: 'Filter.Sets',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    // Filter implementation
    include_impl: function (model) {
        return (model.tags.indexOf('EknSetObject') !== -1);
    },
});
