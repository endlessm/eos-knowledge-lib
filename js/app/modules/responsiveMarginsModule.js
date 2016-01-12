// Copyright 2015 Endless Mobile, Inc.

/* exported ResponsiveMarginsModule */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Module = imports.app.interfaces.module;

const MARGIN_THRESHOLD_TINY = 800;
const MARGIN_THRESHOLD_SMALL = 1000;
const MARGIN_THRESHOLD_MEDIUM = 1200;
const MARGIN_THRESHOLD_LARGE = 1500;
const MARGIN_TINY = 0;
const MARGIN_SMALL = 40;
const MARGIN_MEDIUM = 62;
const MARGIN_LARGE = 83;
const MARGIN_XLARGE = 120;

/**
 * Class: ResponsiveMarginsModule
 * A module that displays a window and has responsive margins.
 */
const ResponsiveMarginsModule = new Lang.Class({
    Name: 'ResponsiveMarginsModule',
    GTypeName: 'EknResponsiveMarginsModule',
    Extends: Gtk.Frame,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },

    _init: function (props={}) {
        this.parent(props);
    },

    vfunc_size_allocate: function (alloc) {
        let margin;
        if (alloc.width < MARGIN_THRESHOLD_TINY) {
            margin = MARGIN_TINY;
        } else if (alloc.width < MARGIN_THRESHOLD_SMALL) {
            margin = MARGIN_SMALL;
        } else if (alloc.width < MARGIN_THRESHOLD_MEDIUM) {
            margin = MARGIN_MEDIUM;
        } else if (alloc.width < MARGIN_THRESHOLD_LARGE) {
            margin = MARGIN_LARGE;
        } else {
            margin = MARGIN_XLARGE;
        }

        let child = this.get_children()[0];
        child.margin_start = margin;
        child.margin_end = margin;

        this.parent(alloc);
    },
});
