// Copyright 2015 Endless Mobile, Inc.

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const StyleClasses = imports.app.styleClasses;

const CardsSegment = new Lang.Class({
    Name: 'CardsSegment',
    GTypeName: 'EknCardsSegment',
    Extends: Gtk.Grid,

    Properties: {
        /**
         * Property: title
         *
         * A string with the title of the segment. Defaults to an empty string.
         */
        'title': GObject.ParamSpec.string('title', 'Segment Title',
            'Title of the segment',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, ''),
    },

    _init: function (props) {
        props = props || {};
        props.column_spacing = 20;
        props.row_spacing = 20;
        props.expand = true;

        this.title_label = new Gtk.Label({
            xalign: 1,
            valign: Gtk.Align.START,
            wrap: true,
            justify: Gtk.Justification.RIGHT,
            max_width_chars: 8, // TODO: change this after clarifying with design how resizing should work
        });
        let separator = new Gtk.Separator({
            expand: true,
            halign: Gtk.Align.FILL,
        });

        this._flow_box = new Gtk.FlowBox({
            expand: true,
            halign: Gtk.Align.START,
            homogeneous: true,
        });

        this._cards = null;

        this.parent(props);

        this.attach(separator, 0, 0, 2, 1);
        this.attach(this.title_label, 0, 1, 1, 1);
        this.attach(this._flow_box, 1, 1, 1, 1);

        this.title_label.get_style_context().add_class(StyleClasses.SECTION_PAGE_A_SEGMENT_TITLE);

    },

    get title () {
        if (this._title)
            return this._title;
        return '';
    },

    set title (v) {
        if (this._title === v) return;
        this._title = v;
        this.title_label.label = this._title.toUpperCase();
        this.notify('title');
    },

    append_cards: function (cards) {
        for (let card of cards) {
            this._flow_box.add(card);
        }
    },
});
