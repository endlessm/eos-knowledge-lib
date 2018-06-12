// Copyright 2016 Endless Mobile, Inc.

/* exported Scrolling */

const Gtk = imports.gi.Gtk;

const Module = imports.framework.interfaces.module;
const HistoryStore = imports.framework.historyStore;
const ScrollingIface = imports.framework.interfaces.scrolling;

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
