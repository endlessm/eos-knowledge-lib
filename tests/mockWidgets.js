// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Lang = imports.lang;

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
