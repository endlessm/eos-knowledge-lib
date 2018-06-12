// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Module = imports.framework.interfaces.module;
const FormattableLabel = imports.framework.widgets.formattableLabel;

/**
 * Class: StaticText
 */
var StaticText = new Module.Class({
    Name: 'ContentGroup.StaticText',
    Extends: FormattableLabel.FormattableLabel,

    _init(props={}) {
        this.parent(Object.assign({
            halign: Gtk.Align.START,
            justify: Gtk.Justification.LEFT,
        }, props));
    }
});
