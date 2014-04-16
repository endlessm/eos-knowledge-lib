// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const Format = imports.format;
const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ListCard = imports.listCard;
const Config = imports.config;

String.prototype.format = Format.format;
let _ = Gettext.dgettext.bind(null, Config.GETTEXT_PACKAGE);
GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

/**
 * Class: ProgressCard
 *
 * This card represents a group of cards in a sequence that can be completed or
 * "checked off."
 * It has two properties, <total-items> and <completed-items>, which can be used
 * to figure the percentage done.
 *
 * Extends:
 *   <ListCard>
 */
const ProgressCard = new Lang.Class({
    Name: 'ProgressCard',
    GTypeName: 'EknProgressCard',
    Extends: ListCard.ListCard,
    Properties: {
        /**
         * Property: total-items
         *
         * The number of completable items represented by this card.
         * If set to 0, then the number will not be displayed.
         *
         * Flags:
         *   Construct only
         */
        'total-items': GObject.ParamSpec.uint('total-items', 'Total items',
            'Number of completable items in total',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            0, GLib.MAXUINT32, 0),
        /**
         * Property: completed-items
         *
         * The number of completed items out of <total-items>.
         */
        'completed-items': GObject.ParamSpec.uint('completed-items',
            'Completed items', 'Number of completed items',
            GObject.ParamFlags.READWRITE,
            0, GLib.MAXUINT32, 0)
    },

    _init: function (props) {
        this._total = 0;
        this._complete = 0;

        this._progress = new Gtk.ProgressBar({
            halign: Gtk.Align.CENTER,
            valign: Gtk.Align.CENTER,
            show_text: true,
            no_show_all: true
        });
        this._progress.get_style_context().add_class('FIXME-private-progress');

        this.parent(props);

        // FIXME Reach into the parent class's defined layout. I guess we can't
        // do this in production code, but it depends on the designs how we
        // structure the drawing. This is just a placeholder.
        let grid = this.get_child();
        grid.remove(this._frame);
        grid.attach_next_to(this._progress, this._title_label,
            Gtk.PositionType.TOP, 1, 1);
        this.setSensitiveChildren([this._title_label, this._subtitle_label,
            this._progress]);

        this.show_all();
    },

    get total_items() {
        return this._total;
    },

    set total_items(value) {
        this._total = value;
        this._update_bar();
    },

    get completed_items() {
        return this._complete;
    },

    set completed_items(value) {
        this._complete = Math.min(value, this._total);
        this._update_bar();
    },

    // Private

    _update_bar: function () {
        if (this._total > 0 && this._complete === this._total)
            this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_COMPLETE);
        else
            this.get_style_context().remove_class(EosKnowledge.STYLE_CLASS_COMPLETE);

        this._progress.text = _("%d of %d done").format(this._complete,
            this._total);
        if (this._total > 0) {
            this._progress.fraction = this._complete / this._total;
            this._progress.show();
        } else {
            this._progress.hide();
        }
    }
});
