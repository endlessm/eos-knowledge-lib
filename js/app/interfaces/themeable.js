// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

/**
 * Interface: Themeable
 * Interface for themeable modules
 *
 * Requires:
 *   Gtk.Widget
 */
const Themeable = new Lang.Interface({
    Name: 'Themeable',
    GTypeName: 'EknThemeable',
    Requires: [ Gtk.Widget ],

    Properties: {
        'css': GObject.ParamSpec.string('css', 'CSS rules',
            'CSS rules to be applied to this widget',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
    },

    set css (v) {
        if (this._css === v)
            return;
        this._css = v;
        if (this._css) {
            Utils.apply_css_to_widget(this._css, this);
        }
        this.notify('css');
    },

    get css () {
        if (this._css)
            return this._css;
        return '';
    },
});
