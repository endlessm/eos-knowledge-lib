/* exported Overlay */

// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;

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
