// Copyright 2016 Endless Mobile, Inc.

/* exported UnreadFilter */

const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;
const ReadingHistoryModel = imports.app.readingHistoryModel;

const UnreadFilter = new Module.Class({
    Name: 'UnreadFilter',
    GTypeName: 'EknUnreadFilter',
    Extends: GObject.Object,
    Implements: [ Module.Module, Filter.Filter ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
        'invert': GObject.ParamSpec.override('invert', Filter.Filter),
    },

    _init: function (props={}) {
        this.parent(props);
    },

    // Filter implementation
    include_impl: function (model) {
        return !ReadingHistoryModel.get_default().is_read_article(model.ekn_id);
    },
});
