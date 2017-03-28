// Copyright 2016 Endless Mobile, Inc.

const Gtk = imports.gi.Gtk;

const Module = imports.app.interfaces.module;
const FormattableLabel = imports.app.widgets.formattableLabel;

/**
 * Class: StaticText
 */
const StaticText = new Module.Class({
    Name: 'ContentGroup.StaticText',
    Extends: FormattableLabel.FormattableLabel,
});
