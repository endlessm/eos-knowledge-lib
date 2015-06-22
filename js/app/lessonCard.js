// Copyright 2014 Endless Mobile, Inc.

const Format = imports.format;
const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const CardA = imports.app.cardA;
const Config = imports.app.config;
const StyleClasses = imports.app.styleClasses;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);
GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

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
const LessonCard = new Lang.Class({
    Name: 'LessonCard',
    GTypeName: 'EknLessonCard',
    Extends: CardA.CardA,
    Properties: {
        /**
         * Property: item-index
         *
         * The number of the lesson or step represented by this card, from a
         * collection of lessons or steps.
         * If set to 0, then the lesson or step number will not be displayed.
         * (That is: the index is human-readable, and so 1-based.)
         */
        'item-index': GObject.ParamSpec.uint('item-index', 'Item index',
            'Number of the lesson or step this card represents',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXUINT32, 0),
        /**
         * Property: complete
         *
         * Set to *true* if this lesson has been completed or otherwise "checked
         * off."
         */
        'complete': GObject.ParamSpec.boolean('complete', 'Complete',
            'Whether this card should be marked as completed',
            GObject.ParamFlags.READWRITE,
            false)
    },

    _init: function (props) {
        this._complete = false;
        this._index = 0;
        this._banner = new Gtk.Frame({
            halign: Gtk.Align.START,
            valign: Gtk.Align.START,
            no_show_all: true,
            margin_top: 10,  // FIXME arbitrary value, waiting on design
            margin_left: 10
        });
        let banner_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.HORIZONTAL,
            visible: true
        });
        this._index_label = new Gtk.Label({
            visible: true
        });
        this._checkmark_label = new Gtk.Label({
            label: '\u2713'  // U+2713 = Unicode check mark
        });
        banner_grid.add(this._index_label);
        banner_grid.add(this._checkmark_label);
        this._banner.add(banner_grid);

        this._banner.get_style_context().add_class('FIXME-private-banner');
        this._index_label.get_style_context().add_class('FIXME-private-index');
        this._checkmark_label.get_style_context().add_class('FIXME-private-checkmark');
        this.parent(props);
    },

    pack_widgets: function (title_label, synopsis_label, image_frame) {
        let grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL
        });
        grid.add(image_frame);
        grid.add(title_label);
        grid.add(synopsis_label);

        let overlay = new Gtk.Overlay();
        overlay.add(grid);
        overlay.add_overlay(this._banner);
        this.add(overlay);
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
            this.get_style_context().add_class(StyleClasses.COMPLETE);
        else
            this.get_style_context().remove_class(StyleClasses.COMPLETE);
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
