// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const SectionPage = imports.sectionPage;

/**
 * Class: SectionPageA
 *
 * This class extends <SectionPage> and represents the section page for 
 * template A of the knowledge apps.
 * It will also be used as the search results page.
 * In addition to the 'title' property published by <SectionPage>, it has 
 * a set of articles to show. Articles are represented by cards. Cards are 
 * grouped into sections call 'Segments'. A segment has a title, which is the 
 * type of cards in its section, and a list of cards to display.
 *
 */
const SectionPageA = new Lang.Class({
    Name: 'SectionPageA',
    GTypeName: 'EknSectionPageA',
    Extends: SectionPage.SectionPage,
    Properties: {
        /**
         * Property: segments
         * An object where keys are a string label representing a card type, e.g. 'Lesson',
         * and values are a list of <Card> widgets associated with that type. Each key-value
         * pair is converted into a 'CardsSegment' in the setter. SectionPage maintains a list of
         * card segments internally.
         */
    },

    _init: function (props) {
        this.parent(props);

        this._segments = null;

        this._scroller.hscrollbar_policy = Gtk.PolicyType.NEVER;

        // We need the segment titles of all be right aligned with each other.
        // This gets tricky as they aren't all in the same container, so we
        // will keep them in a size group.
        this._right_column_size_group = new Gtk.SizeGroup({
            mode: Gtk.SizeGroupMode.HORIZONTAL
        });

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SECTION_PAGE_A);
    },

    pack_title_label: function (title_label) {
        this._content_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            expand: true,
            valign: Gtk.Align.START,
            row_spacing: 20,
            margin_left: 100,
            margin_right: 100
        });
        this._content_grid.add(title_label);

        this._scroller.add(this._content_grid);
        this.add(this._scroller);
    },

    set segments (v) {
        if (this._cards_map === v)
            return;

        if (this._segments !== null) {
            for (let segment of this._segments) {
                this._right_column_size_group.remove_widget(segment.title_label);
                this._content_grid.remove(segment);
            }
        }

        this._cards_map = v;
        this._segments = [];
        if (this._cards_map !== null) {
            for (let segment_title in this._cards_map) {
                let cards = this._cards_map[segment_title];

                let segment = new CardsSegment({
                    title: segment_title
                });
                this._right_column_size_group.add_widget(segment.title_label);

                segment.cards = cards;
                this._segments.push(segment);
                this._content_grid.add(segment);
                segment.show_all();
            }
        }
        this._scroller.set_need_more_content(false);
    },

    get segments () {
        return this._cards_map;
    }

});

const CardsSegment = new Lang.Class({
    Name: 'CardsSegment',
    GTypeName: 'EknCardsSegment',
    Extends: Gtk.Grid,

    Properties: {
        // title property
        // A string with the title of the segment. Defaults to an empty string.
        'title': GObject.ParamSpec.string('title', 'Segment Title',
            'Title of the segment',
            GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, '')

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
            max_width_chars: 8 // TODO: change this after clarifying with design how resizing should work
        });
        let separator = new Gtk.Separator({
            expand: true,
            halign: Gtk.Align.FILL
        });

        this._flow_box = new Gtk.FlowBox({
            expand: true,
            halign: Gtk.Align.START,
            homogeneous: true
        });

        this._cards = null;

        this.parent(props);

        this.attach(separator, 0, 0, 2, 1);
        this.attach(this.title_label, 0, 1, 1, 1);
        this.attach(this._flow_box, 1, 1, 1, 1);

        this.title_label.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SECTION_PAGE_A_SEGMENT_TITLE);

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

    set cards (v) {
        if (this._cards === v)
            return;
        if (this._cards !== null) {
            for (let card of this._cards) {
                this._flow_box.remove(card);
            }
        }

        this._cards = v;
        if (this._cards !== null) {
            for (let card of this._cards) {
                this._flow_box.add(card);
            }
        }
    },

    get cards () {
        return this._cards;
    }
});
