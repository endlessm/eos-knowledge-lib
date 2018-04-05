// Copyright 2016 Endless Mobile, Inc.

/* exported Scrolling */

const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const HistoryStore = imports.app.historyStore;
const ScrollingIface = imports.app.interfaces.scrolling;

/**
 * Class: Scrolling
 * Layout template that allows its content to scroll vertically
 */
var Scrolling = new Module.Class({
    Name: 'Layout.Scrolling',
    Extends: Gtk.ScrolledWindow,
    Implements: [ScrollingIface.Scrolling],

    _init: function (props={}) {
        if (!('vscrollbar_policy' in props))
            props.vscrollbar_policy = Gtk.PolicyType.AUTOMATIC;
        this.parent(props);
        this.add(this.create_submodule('content'));
    },
});
