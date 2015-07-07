// Copyright 2014 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const InfiniteScrolledWindow = imports.app.infiniteScrolledWindow;
const SectionPage = imports.app.sectionPage;
const StyleClasses = imports.app.styleClasses;

/**
 * Class: SectionPageB
 *
 * This class extends <SectionPage> and represents the section page for 
 * template B of the knowledge apps.
 * It will also be used as the search results page for template B.
 * It has a title and a set of articles to show. Articles are represented
 * by text cards.
 *
 */
const SectionPageB = new Lang.Class({
    Name: 'SectionPageB',
    GTypeName: 'EknSectionPageB',
    Extends: SectionPage.SectionPage,
    Properties: {
        /**
         * Property: collapsed
         *
         * True if the section page should display in a collapsed state.
         *
         * Defaults to false.
         */
        'collapsed': GObject.ParamSpec.boolean('collapsed', 'Collapsed',
            'True if table of contents should display in a collapsed state.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            false),
        /**
         * Property: transition-duration
         * Specifies the duration of the transition between pages
         */
        'transition-duration': GObject.ParamSpec.uint('transition-duration', 'Transition Duration',
            'Specifies (in ms) the duration of the transition between pages.',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT, 0, GLib.MAXUINT32, 200),
        /**
         * Property: cards
         * A list of <TextCard> widgets representing the cards to be displayed
         * on this section.
         * It is set as a normal javascript object since GJS does not support setting
         * objects using ParamSpec.
         */
    },

    _init: function (props) {
        this._card_list_box = new Gtk.Grid({
            orientation: Gtk.Orientation.VERTICAL,
            valign: Gtk.Align.START
        });

        this._cards = null;
        this._transition_duration = 0;

        this._collapsed = false;

        this.parent(props);

        this._title_label_revealer = new Gtk.Revealer({
            reveal_child: true,
            expand: true,
            transition_type: Gtk.RevealerTransitionType.SLIDE_RIGHT,
            margin_end: 80,
        });

        let title_frame = new Gtk.Frame();
        title_frame.get_style_context().add_class(StyleClasses.SECTION_PAGE_B_TITLE_FRAME);
        title_frame.add(this._title_label_revealer);

        this.bind_property('transition-duration', this._title_label_revealer,
            'transition-duration', GObject.BindingFlags.SYNC_CREATE);

        this.orientation = Gtk.Orientation.HORIZONTAL;
        this.expand = true;
        this.add(title_frame);

        this._scrolled_window = new SectionPageBScrolledWindow();
        this._scrolled_window.connect('notify::need-more-content', () => {
            if (this._scrolled_window.need_more_content) {
                this.emit('load-more-results');
            }
        });
        this._scrolled_window.add(this._card_list_box);
        this.add(this._scrolled_window);

        this.get_style_context().add_class(StyleClasses.SECTION_PAGE_B);
    },

    highlight_card: function (card) {
        if (this._highlighted_card === card)
            return;

        this.clear_highlighted_cards();

        this._highlighted_card = card;
        this._highlighted_card.get_style_context().add_class(StyleClasses.HIGHLIGHTED);
    },

    highlight_card_with_name: function (card_name, fallback_card_name) {
        this.clear_highlighted_cards();
        let filtered_card = this._filter_card_with_name(card_name);
        if (filtered_card) {
            this.highlight_card(filtered_card);
        } else {
            filtered_card = this._filter_card_with_name(fallback_card_name);
            if (filtered_card)
                this.shade_card(filtered_card);
        }
    },

    shade_card: function (card) {
        if (this._shaded_card === card)
            return;

        this._shaded_card = card;
        this._shaded_card.get_style_context().remove_class(StyleClasses.HIGHLIGHTED);
        this._shaded_card.get_style_context().add_class(StyleClasses.SHADED);
    },

    /*
     * This method clears both the highlighted and shaded cards, if present.
     */
    clear_highlighted_cards: function () {
        if (this._highlighted_card !== null && typeof this._highlighted_card !== 'undefined') {
            this._highlighted_card.get_style_context().remove_class(StyleClasses.HIGHLIGHTED);
            this._highlighted_card = null;
        }
        if (this._shaded_card !== null && typeof this._shaded_card !== 'undefined') {
            this._shaded_card.get_style_context().remove_class(StyleClasses.SHADED);
            this._shaded_card = null;
        }
    },

    pack_title_banner: function (title_banner) {
        title_banner.valign = Gtk.Align.END;

        let child = this._title_label_revealer.get_child();
        if (typeof child !== 'undefined' && child !== null)
            this._title_label_revealer.remove(child);
        this._title_label_revealer.add(title_banner);
    },

    _filter_card_with_name: function (card_name) {
        let filtered_cards = this._cards.filter(function (c) {
            return c.title === card_name;
        });
        if (filtered_cards.length >= 1)
            return filtered_cards[0];
        else
            return null;
    },

    set cards (v) {
        if (this._cards === v)
            return;
        if (this._cards !== null) {
            for (let card of this._cards) {
                this._card_list_box.remove(card);
            }
        }
        this._cards = v;
        if (this._cards !== null) {
            for (let card of this._cards) {
                this._card_list_box.add(card);
            }
        }
        this._scrolled_window.need_more_content = false;
    },

    get cards () {
        return this._cards;
    },

    set collapsed (v) {
        if (this._collapsed === v)
            return;
        this._collapsed = v;
        if (this._collapsed) {
            this._title_label_revealer.expand = false;
            this._title_label_revealer.reveal_child = false;
        } else {
            this._title_label_revealer.expand = true;
            this._title_label_revealer.reveal_child = true;
        }
        this.notify('collapsed');
    },

    get collapsed () {
        return this._collapsed;
    },

    set transition_duration (v) {
        if (this._transition_duration === v)
            return;
        this._transition_duration = v;
        this.notify('transition-duration');
    },

    get transition_duration () {
        return this._transition_duration;
    },
});

const SectionPageBScrolledWindow = new Lang.Class({
    Name: 'SectionPageBScrolledWindow',
    GTypeName: 'EknSectionPageBScrolledWindow',
    Extends: InfiniteScrolledWindow.InfiniteScrolledWindow,

    _NATURAL_WIDTH: 400,
    _MINIMAL_WIDTH: 200,

    _init: function (props) {
        props = props || {};
        props.hscrollbar_policy = Gtk.PolicyType.NEVER;
        props.vexpand = true;
        props.hexpand = false;
        props.valign = Gtk.Align.FILL;
        this.parent(props);
    },

    vfunc_get_preferred_width: function () {
        return [this._MINIMAL_WIDTH, this._NATURAL_WIDTH];
    }
});
