// Copyright 2016 Endless Mobile, Inc.

/* exported NonDisambig */

const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;

const NonDisambig = new Module.Class({
    Name: 'NonDisambigFilter',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    // Filter implementation
    include_impl: function (model) {
        return model.synopsis.search('(may (also )?refer|(common|usual)ly refers) to') === -1;
    },
});
