// Copyright 2015 Endless Mobile, Inc.

/* exported MockButton, MockHistoryButtons, MockItemGroup,
MockScrolledArrangement, MockSearchBox */

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Minimal = imports.tests.minimal;

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

const MockHistoryButtons = new Lang.Class({
    Name: 'MockHistoryButtons',
    Extends: GObject.Object,

    _init: function () {
        this.parent();
        this.back_button = new MockButton();
        this.forward_button = new MockButton();
    },
});

const MockScrolledArrangement = new Lang.Class({
    Name: 'MockScrolledArrangement',
    Extends: Minimal.MinimalArrangement,
    Properties: {
        'preferred-width': GObject.ParamSpec.int('preferred-width', '', '',
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
    Extends: Minimal.MinimalModule,
    Signals: {
        'article-selected': {},
    },
});
