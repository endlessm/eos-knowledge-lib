// Copyright (C) 2016 Endless Mobile, Inc.

/* exported UnreadFilter */

const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;
const ReadingHistoryModel = imports.app.readingHistoryModel;

const UnreadFilter = new Module.Class({
    Name: 'UnreadFilter',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    // Filter implementation
    include_impl: function (model) {
        return !ReadingHistoryModel.get_default().is_read_article(model.ekn_id);
    },
});
