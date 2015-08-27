// Copyright 2015 Endless Mobile, Inc.

/* exported MockButton, MockHistoryButtons, MockItemGroup,
MockScrolledArrangement, MockSearchBox */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Minimal = imports.tests.minimal;
const Module = imports.app.interfaces.module;

const MockButton = new Lang.Class({
    Name: 'MockButton',
    Extends: GObject.Object,
    Properties: {
        'sensitive': GObject.ParamSpec.boolean('sensitive', '', '',
            GObject.ParamFlags.READWRITE, true),
    },
    Signals: {
        'clicked': {},
    },
});

const MockScrolledArrangement = new Lang.Class({
    Name: 'MockScrolledArrangement',
    Extends: Minimal.MinimalArrangement,
    Properties: {
        'preferred-width': GObject.ParamSpec.int('preferred-width', '', '',
            GObject.ParamFlags.READWRITE, -1, 9999, -1),
        'bottom-buffer': GObject.ParamSpec.int('bottom-buffer', '', '',
            GObject.ParamFlags.READWRITE, -1, 9999, -1),
    },
    Signals: {
        'need-more-content': {},  // needed for several arrangements
    },
});

const MockSearchBox = new Lang.Class({
    Name: 'MockSearchBox',
    Extends: Gtk.Label,
    Signals: {
        'activate': {},
        'text-changed': {},
        'menu-item-selected': {},
    },

    _init: function (props={}) {
        this.parent(props);
    },

    set_menu_items: function () {},

    set_text_programmatically: function () {},
});

const MockItemGroup = new Lang.Class({
    Name: 'MockItemGroup',
    Extends: Gtk.Widget,
    Implements: [ Module.Module ],

    Properties: {
        'factory': GObject.ParamSpec.override('factory', Module.Module),
        'factory-name': GObject.ParamSpec.override('factory-name', Module.Module),
    },
    Signals: {
        'article-selected': {},
        'need-more-content': {},
    },

    add_card: function () {},
});
