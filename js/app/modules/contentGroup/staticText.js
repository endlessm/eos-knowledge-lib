// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;

/**
 * Class: StaticText
 */
const StaticText = new Module.Class({
    Name: 'ContentGroup.StaticText',
    Extends: Gtk.Label,
});
