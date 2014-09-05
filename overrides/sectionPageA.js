// Copyright 2014 Endless Mobile, Inc.

const EosKnowledge = imports.gi.EosKnowledge;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const InfiniteScrolledWindow = imports.infiniteScrolledWindow;
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

    LOADING_BOTTOM_BUFFER: 250,

    _init: function (props) {
        this.parent(props);

        this._segments = {};


        // We need the segment titles of all be right aligned with each other.
        // This gets tricky as they aren't all in the same container, so we
        // will keep them in a size group.
        this._right_column_size_group = new Gtk.SizeGroup({
            mode: Gtk.SizeGroupMode.HORIZONTAL
        });

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SECTION_PAGE_A);
    },

    pack_title_label: function (title_label) {
        this._scrolled_window = new InfiniteScrolledWindow.InfiniteScrolledWindow({
            hscrollbar_policy: Gtk.PolicyType.NEVER,
            bottom_buffer: this.LOADING_BOTTOM_BUFFER,
        });
        this._scrolled_window.connect('notify::need-more-content', Lang.bind(this, function () {
            if (this._scrolled_window.need_more_content) {
                this.emit('load-more-results');
            }
        }));

        this._content_grid = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            expand: true,
            valign: Gtk.Align.START,
            row_spacing: 20,
            margin_left: 100,
            margin_right: 100
        });
        this._content_grid.add(title_label);
        this._scrolled_window.add(this._content_grid);
        this.add(this._scrolled_window);
    },

    /*
     *  Method: append_to_segment
     *
     *  Appends a set of cards to the segment specified by segment_title
     *  If no segment with title of segment_title exists, this will create
     *  one.
     */
    append_to_segment: function (segment_title, cards) {
        if (segment_title in this._segments) {
            this._segments[segment_title].append_cards(cards);
        } else {
            let segment = new CardsSegment({
                title: segment_title
            });
            this._right_column_size_group.add_widget(segment.title_label);
            this._content_grid.add(segment);
            segment.show_all();
            segment.append_cards(cards);
            this._segments[segment_title] = segment;
        }
        this._scrolled_window.need_more_content = false;
    },

    /*
     *  Method: remove_segment
     *
     *  Removes the segment specified by segment_title
     */
    remove_segment: function (segment_title) {
        let segment = this._segments[segment_title];
        this._content_grid.remove(segment);
        this._right_column_size_group.remove_widget(segment.title_label);
        delete this._segments[segment_title];
    },

    remove_all_segments: function () {
        for (let segment_title in this._segments) {
            this.remove_segment(segment_title);
        }
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

    append_cards: function (cards) {
        for (let card of cards) {
            this._flow_box.add(card);
        }
    }
});
