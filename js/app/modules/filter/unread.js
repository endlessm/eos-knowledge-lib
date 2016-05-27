// Copyright 2016 Endless Mobile, Inc.

/* exported Unread */

const GObject = imports.gi.GObject;

const Filter = imports.app.interfaces.filter;
const Module = imports.app.interfaces.module;
const ReadingHistoryModel = imports.app.readingHistoryModel;

const Unread = new Module.Class({
    Name: 'Filter.Unread',
    Extends: GObject.Object,
    Implements: [Filter.Filter],

    // Filter implementation
    include_impl: function (model) {
        return !ReadingHistoryModel.get_default().is_read_article(model.ekn_id);
    },
});
