// Copyright 2015 Endless Mobile, Inc.

const Lang = imports.lang;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Utils = imports.tests.utils;
Utils.register_gresource();

const Themeable = imports.app.interfaces.themeable;

Gtk.init(null);

const ThemeableClass = new Lang.Class({
    Name: 'TestCard',
    Extends: Gtk.Grid,
    Implements: [ Themeable.Themeable ],

    Properties: {
        'css': GObject.ParamSpec.override('css', Themeable.Themeable),
    },
});

describe ('Themeable interface', function () {
    let themeableClass;

    beforeEach(function () {
        themeableClass = new ThemeableClass();
    });

    it ('constructs', function () {});
});
