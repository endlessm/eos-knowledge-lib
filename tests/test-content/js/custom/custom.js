// Copyright 2018 Endless Mobile, Inc.

/* exported Custom */

const Gtk = imports.gi.Gtk;
const Module = imports.app.interfaces.module;

var Custom = new Module.Class({
    Name: 'Custom.Custom',
    Extends: Gtk.Label,
});
