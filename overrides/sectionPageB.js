// Copyright 2014 Endless Mobile, Inc.

const Cairo = imports.gi.cairo;
const Endless = imports.gi.Endless;
const EosKnowledge = imports.gi.EosKnowledge;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const SectionPage = imports.sectionPage;

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

        this.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SECTION_PAGE_B);
    },

    pack_title_label: function (title_label, scrolled_window) {
        title_label.xalign = 0;
        title_label.yalign = 1;
        title_label.expand = true;
        title_label.lines = 2;

        this._title_label_revealer = new Gtk.Revealer({
            reveal_child: true,
            expand: true,
            transition_type: Gtk.RevealerTransitionType.SLIDE_RIGHT,
            margin_right: 80,
        });
        this._title_label_revealer.add(title_label);

        let title_frame = new Gtk.Frame();
        title_frame.get_style_context().add_class(EosKnowledge.STYLE_CLASS_SECTION_PAGE_B_TITLE_FRAME);
        title_frame.add(this._title_label_revealer);

        this.bind_property('transition-duration', this._title_label_revealer,
            'transition-duration', GObject.BindingFlags.SYNC_CREATE);

        this.orientation = Gtk.Orientation.HORIZONTAL;
        this.expand = true;
        this.add(title_frame);

        this._scrolled_window = scrolled_window;
        this._scrolled_window.add(this._card_list_box);
        this._scrolled_window.hscrollbar_policy = Gtk.PolicyType.NEVER;
        this._scrolled_window.vexpand = true;
        this._scrolled_window.hexpand = false;
        this._scrolled_window.valign = Gtk.Align.FILL;
        this._scrolled_window.width_request = 400;
        this.add(this._scrolled_window);
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
