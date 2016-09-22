/* exported Overlay */

// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;

/**
 * Module: Layout.Overlay
 * Layout that can position other modules on top of one another
 *
 * This layout can be used to stack modules on top of one another.
 * The module in the 'content' slot determines the size of the module, then the
 * modules in the 'overlays' multi-slot are positioned on top of it.
 *
 * The modules' 'halign' and 'valign' properties, as well as their 'margin' CSS
 * properties, determine where they are arranged on top of the main module.
 * For example, a module with halign: end, valign: end, and in CSS margin: 10px
 * will be positioned 10px away from the bottom right corner.
 *
 * Slots:
 *   content - for the main module
 *   overlays - a list of other modules to be positioned on top of the content
 */
const Overlay = new Module.Class({
    Name: 'Layout.Overlay',
    Extends: Gtk.Overlay,

    Slots: {
        'content': {},
        'overlays': {
            array: true,
        },
    },

    _init: function (props={}) {
        this.parent(props);

        this.add(this.create_submodule('content'));
        this.create_submodule('overlays').forEach(this.add_overlay, this);
    },
});
