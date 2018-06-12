// Copyright 2016 Endless Mobile, Inc.

/* exported ThemeableImage */

const Gtk = imports.gi.Gtk;

const Module = imports.framework.interfaces.module;
const ThemeableImageWidget = imports.framework.widgets.themeableImage;

/**
 * Class: ThemeableImage
 * Decoration widget that draws an image
 *
 */
var ThemeableImage = new Module.Class({
    Name: 'Decoration.ThemeableImage',
    Extends: ThemeableImageWidget.ThemeableImage,
});
