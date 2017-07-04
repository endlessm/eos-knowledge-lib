/* exported Placeholder */

// Copyright 2017 Endless Mobile, Inc.

const Gettext = imports.gettext;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const Config = imports.app.config;
const Module = imports.app.interfaces.module;

const _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);

/**
 * Class: Placeholder
 * Module to occupy a slot while developing an app
 */
var Placeholder = new Module.Class({
    Name: 'Layout.Placeholder',
    Extends: Gtk.Frame,

    Properties: {
        'text': GObject.ParamSpec.string('text', 'Text', 'Placeholder text',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            _('Placeholder')),
    },

    _init: function (props={}) {
        this.parent(props);

        let label = new Gtk.Label({
            halign: Gtk.Align.START,
            valign: Gtk.Align.START,
        });
        this.bind_property('text', label, 'label',
            GObject.BindingFlags.SYNC_CREATE);
        this.add(label);
    },
});
