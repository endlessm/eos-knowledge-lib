// Copyright 2014 Endless Mobile, Inc.

/* global _EosKnowledge */

const _Format = imports.format;
const _Gettext = imports.gettext;
const _GLib = imports.gi.GLib;
const _GObject = imports.gi.GObject;
const _Gtk = imports.gi.Gtk;
const _Lang = imports.lang;

const _Card = imports.card;
const _Config = imports.config;

String.prototype.format = _Format.format;
let _ = _Gettext.dgettext.bind(null, _Config.GETTEXT_PACKAGE);
_GObject.ParamFlags.READWRITE = _GObject.ParamFlags.READABLE | _GObject.ParamFlags.WRITABLE;

/**
 * Class: LessonCard
 *
 * This card represents a lesson: for example, a how-to article, or a lesson
 * from a Khan Academy course.
 * It can be given an integer index <item-index> which might be displayed as
 * something like "Lesson 1", and it can be set to <complete>, which might be
 * displayed as a checkmark or something similar.
 *
 * Extends:
 *   <Card>
 */
const LessonCard = new _Lang.Class({
    Name: 'LessonCard',
    GTypeName: 'EknLessonCard',
    Extends: _Card.Card,
    Properties: {
        /**
         * Property: item-index
         *
         * The number of the lesson or step represented by this card, from a
         * collection of lessons or steps.
         * If set to 0, then the lesson or step number will not be displayed.
         * (That is: the index is human-readable, and so 1-based.)
         */
        'item-index': _GObject.ParamSpec.uint('item-index', 'Item index',
            'Number of the lesson or step this card represents',
            _GObject.ParamFlags.READWRITE,
            0, _GLib.MAXUINT32, 0),
        /**
         * Property: complete
         *
         * Set to *true* if this lesson has been completed or othwerise "checked
         * off."
         */
        'complete': _GObject.ParamSpec.boolean('complete', 'Complete',
            'Whether this card should be marked as completed',
            _GObject.ParamFlags.READWRITE,
            false)
    },

    _init: function (props) {
        this._complete = false;
        this._index = 0;
        this._banner = new _Gtk.Frame({
            halign: _Gtk.Align.START,
            valign: _Gtk.Align.START,
            no_show_all: true,
            margin_top: 10,  // FIXME arbitrary value, waiting on design
            margin_left: 10
        });
        let banner_grid = new _Gtk.Grid({
            orientation: _Gtk.Orientation.HORIZONTAL,
            visible: true
        });
        this._index_label = new _Gtk.Label({
            visible: true
        });
        this._checkmark_label = new _Gtk.Label({
            label: '\u2713'  // U+2713 = Unicode check mark
        });
        banner_grid.add(this._index_label);
        banner_grid.add(this._checkmark_label);
        this._banner.add(banner_grid);

        this._banner.get_style_context().add_class('FIXME-private-banner');
        this._index_label.get_style_context().add_class('FIXME-private-index');
        this._checkmark_label.get_style_context().add_class('FIXME-private-checkmark');
        this.parent(props);

        // FIXME Reach into the parent class's defined layout. I guess we can't
        // do this in production code, but it depends on the designs how we
        // structure the drawing. This is just a placeholder.
        let grid = this.get_child();
        this.remove(grid);
        let overlay = new _Gtk.Overlay();
        overlay.add(grid);
        this.add(overlay);
        this.setSensitiveChildren([this._title_label, this._subtitle_label,
            this._frame, this._banner, this._index_label,
            this._checkmark_label]);

        overlay.add_overlay(this._banner);
        this.show_all();
    },

    get item_index() {
        return this._index;
    },

    set item_index(value) {
        this._index = value;
        this._update_banner();
    },

    get complete() {
        return this._complete;
    },

    set complete(value) {
        this._complete = value;
        if (this._complete)
            this.get_style_context().add_class(_EosKnowledge.STYLE_CLASS_COMPLETE);
        else
            this.get_style_context().remove_class(_EosKnowledge.STYLE_CLASS_COMPLETE);
        this._update_banner();
    },

    // Private

    _update_banner: function () {
        this._index_label.label = (this._index > 0)?
            _("Lesson %d").format(this._index) : '';
        this._checkmark_label.visible = this._complete;
        this._banner.visible = (this._index > 0 || this._complete);
    }
});
