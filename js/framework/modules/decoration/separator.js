// Copyright 2016 Endless Mobile, Inc.

/* exported Separator */

const Gtk = imports.gi.Gtk;

const Module = imports.framework.interfaces.module;

/**
 * Class: Separator
 * Decoration widget that draws a separation line between other modules
 *
 * This decoration widget draws a separation line between other modules. Its
 * orientation may render a vertical or horizontal separator.
 *
 * Internally, this decoration module encapsulates a GtkSeparator as a module,
 * so that it can be used directly to create apps in our modular system.
 */
var Separator = new Module.Class({
    Name: 'Decoration.Separator',
    Extends: Gtk.Separator,
});
