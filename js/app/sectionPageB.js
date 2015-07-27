// Copyright 2014 Endless Mobile, Inc.

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

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
        this._cards = null;
        this._transition_duration = 0;

        this._collapsed = false;

        this._title_label_revealer = new Gtk.Revealer({
            reveal_child: true,
            expand: true,
            transition_type: Gtk.RevealerTransitionType.SLIDE_RIGHT,
            margin_end: 80,
        });

        this.parent(props);

        let title_frame = new Gtk.Frame();
        title_frame.get_style_context().add_class(StyleClasses.SECTION_PAGE_B_TITLE_FRAME);
        title_frame.add(this._title_label_revealer);

        this.bind_property('transition-duration', this._title_label_revealer,
            'transition-duration', GObject.BindingFlags.SYNC_CREATE);

        this.orientation = Gtk.Orientation.HORIZONTAL;
        this.expand = true;
        this.add(title_frame);

        this._arrangement = this.factory.create_named_module('results-arrangement', {
            preferred_width: 400,
            hexpand: false,
        });
        this._arrangement.connect('need-more-content', () =>
            this.emit('load-more-results'));
        this.add(this._arrangement);

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

        // FIXME: Temporary hack to adapt the ellipses in Templates A & B. Without this,
        // Ellipses in Template B are broken.
        // This method is used for both the SetBanner and the SearchBanner, so
        // we need to probe which one we are dealing with to alter its prop.
        if (typeof title_banner._title_label !== 'undefined') {
            title_banner._title_label.max_width_chars = 0;
        } else {
            title_banner.max_width_chars = 0;
        }

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
        if (this._cards)
            this._arrangement.clear();
        this._cards = v;
        if (this._cards)
            this._cards.forEach(this._arrangement.add_card, this._arrangement);
    },

    get cards () {
        return this._cards;
    },

    append_cards: function (cards) {
        this._cards.push.apply(this._cards, cards);
        cards.forEach(this._arrangement.add_card, this._arrangement);
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
