// Copyright 2015 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const ContentObjectModel = imports.search.contentObjectModel;
const Utils = imports.app.utils;

/**
 * Interface: Card
 * Interface for card modules
 *
 * Requires:
 *   Gtk.Widget
 */
const Card = new Lang.Interface({
    Name: 'Card',
    GTypeName: 'EknCardIface',  // FIXME should be EknCard
    Requires: [ Gtk.Widget ],

    Properties: {
        'css': GObject.ParamSpec.string('css', 'CSS rules',
            'CSS rules to be applied to this widget',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
        'fade-in': GObject.ParamSpec.boolean('fade-in', 'Fade in',
            'Whether the card should fade in to being visible.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            false),
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

    // Overridable in tests; otherwise keep synchronized with the CSS
    FADE_IN_TIME_MS: 1000,

    /**
     * Method: show_all
     * Overrides *Gtk.Widget.show_all()*.
     */
    show_all: function () {
        if (this.fade_in) {
            this.get_style_context().add_class('fade-in');
            // Cards not sensitive till fully faded in
            this.sensitive = false;
            Mainloop.timeout_add(this.FADE_IN_TIME_MS, () => {
                this.sensitive = true;
                return GLib.SOURCE_REMOVE;
            });
        } else {
            this.get_style_context().add_class('visible');
        }
        Gtk.Widget.prototype.show_all.call(this);
    },
});
